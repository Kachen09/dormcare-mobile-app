import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  signOut,
  updateProfile,
} from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  writeBatch,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, tenantAuth } from "../config/firebase";
import { useAuth } from "./AuthContext";

const DormContext = createContext(null);
const collectionNames = ["tenants", "contracts", "bills", "complaints"];
const emptyData = {
  tenants: [],
  contracts: [],
  bills: [],
  complaints: [],
};

function normalizeEmail(email) {
  return (email || "").trim().toLowerCase();
}

function toRecord(document) {
  return { id: document.id, ...document.data() };
}

export function DormProvider({ children }) {
  const { user, isAdmin, profileLoading } = useAuth();
  const [data, setData] = useState(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || profileLoading) {
      setData(emptyData);
      setLoading(Boolean(user));
      setError("");
      return undefined;
    }

    const email = normalizeEmail(user.email);
    const pendingCollections = new Set(collectionNames);
    const unsubscribeListeners = [];

    setData(emptyData);
    setLoading(true);
    setError("");

    collectionNames.forEach((name) => {
      const records = collection(db, name);
      const recordsQuery = isAdmin
        ? query(records)
        : query(records, where(name === "tenants" ? "email" : "tenantEmail", "==", email));

      const unsubscribe = onSnapshot(
        recordsQuery,
        (snapshot) => {
          const items = snapshot.docs.map(toRecord);
          setData((current) => ({ ...current, [name]: items }));
          pendingCollections.delete(name);

          if (pendingCollections.size === 0) {
            setLoading(false);
          }
        },
        (snapshotError) => {
          setError(snapshotError.message || "โหลดข้อมูลจาก Firestore ไม่สำเร็จ");
          pendingCollections.delete(name);

          if (pendingCollections.size === 0) {
            setLoading(false);
          }
        },
      );

      unsubscribeListeners.push(unsubscribe);
    });

    return () => {
      unsubscribeListeners.forEach((unsubscribe) => unsubscribe());
    };
  }, [user, isAdmin, profileLoading]);

  const addTenant = async (tenant) => {
    if (!isAdmin) {
      throw new Error("เฉพาะผู้ดูแลระบบเท่านั้นที่สร้างบัญชีผู้เช่าได้");
    }

    if (tenant.password !== tenant.confirmPassword) {
      throw new Error("รหัสผ่านทั้งสองช่องไม่ตรงกัน");
    }

    const email = normalizeEmail(tenant.email);
    let credential;

    try {
      credential = await createUserWithEmailAndPassword(
        tenantAuth,
        email,
        tenant.password,
      );
      await updateProfile(credential.user, { displayName: tenant.name.trim() });

      const batch = writeBatch(db);
      batch.set(doc(db, "users", credential.user.uid), {
        email,
        displayName: tenant.name.trim(),
        phone: tenant.phone.trim(),
        role: "tenant",
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, "tenants", credential.user.uid), {
        name: tenant.name.trim(),
        email,
        phone: tenant.phone.trim(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
    } catch (error) {
      if (credential?.user) {
        await deleteUser(credential.user).catch(() => {});
      }

      if (error.code === "auth/email-already-in-use") {
        throw new Error("อีเมลนี้มีบัญชี Firebase อยู่แล้ว");
      }
      if (error.code === "auth/invalid-email") {
        throw new Error("รูปแบบอีเมลไม่ถูกต้อง");
      }
      if (error.code === "auth/weak-password") {
        throw new Error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      }
      if (error.code === "auth/operation-not-allowed") {
        throw new Error("กรุณาเปิด Email/Password ใน Firebase Authentication");
      }
      if (error.code === "auth/network-request-failed") {
        throw new Error("เชื่อมต่อ Firebase ไม่ได้ กรุณาตรวจอินเทอร์เน็ต");
      }
      if (error.code === "permission-denied") {
        throw new Error("Firestore Rules ยังไม่อนุญาต กรุณาเผยแพร่ Rules ล่าสุด");
      }

      throw error;
    } finally {
      await signOut(tenantAuth).catch(() => {});
    }

    return { accountCreated: true };
  };

  const updateTenant = async (id, tenant) => {
    return updateDoc(doc(db, "tenants", id), {
      name: tenant.name.trim(),
      email: normalizeEmail(tenant.email),
      phone: tenant.phone.trim(),
      updatedAt: serverTimestamp(),
    });
  };

  const removeTenant = async (id) => {
    return deleteDoc(doc(db, "tenants", id));
  };

  const normalizeContract = (contract) => ({
    tenantEmail: normalizeEmail(contract.tenantEmail),
    roomNumber: contract.roomNumber.trim(),
    startDate: contract.startDate.trim(),
    endDate: contract.endDate.trim(),
    monthlyRent: Number(contract.monthlyRent) || 0,
    status: contract.status,
  });

  const roomDocuments = (roomNumber) =>
    getDocs(
      query(collection(db, "rooms"), where("roomNumber", "==", roomNumber)),
    );

  const contractsForRoom = (roomNumber) =>
    getDocs(
      query(
        collection(db, "contracts"),
        where("roomNumber", "==", roomNumber),
      ),
    );

  const updateRoomAvailability = (batch, roomSnapshot, hasActiveContract) => {
    roomSnapshot.docs.forEach((room) => {
      batch.update(room.ref, {
        status: hasActiveContract ? "มีผู้เช่า" : "ว่าง",
        updatedAt: serverTimestamp(),
      });
    });
  };

  const addContract = async (contract) => {
    const normalized = normalizeContract(contract);
    const [roomSnapshot, existingContracts] = await Promise.all([
      roomDocuments(normalized.roomNumber),
      contractsForRoom(normalized.roomNumber),
    ]);

    if (!roomSnapshot.size) {
      throw new Error(`ไม่พบห้อง ${normalized.roomNumber} ในรายการห้องพัก`);
    }

    const alreadyOccupied = existingContracts.docs.some(
      (item) => item.data().status === "กำลังเช่า",
    );
    if (normalized.status === "กำลังเช่า" && alreadyOccupied) {
      throw new Error(`ห้อง ${normalized.roomNumber} มีสัญญาที่กำลังเช่าอยู่แล้ว`);
    }

    const batch = writeBatch(db);
    batch.set(doc(collection(db, "contracts")), {
      ...normalized,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    updateRoomAvailability(
      batch,
      roomSnapshot,
      alreadyOccupied || normalized.status === "กำลังเช่า",
    );
    await batch.commit();
  };

  const updateContract = async (id, contract) => {
    const contractRef = doc(db, "contracts", id);
    const currentSnapshot = await getDoc(contractRef);
    if (!currentSnapshot.exists()) {
      throw new Error("ไม่พบสัญญาที่ต้องการแก้ไข");
    }

    const currentContract = currentSnapshot.data();
    const normalized = normalizeContract(contract);
    const roomNumbers = [...new Set([
      currentContract.roomNumber,
      normalized.roomNumber,
    ])];
    const [roomSnapshots, contractSnapshots] = await Promise.all([
      Promise.all(roomNumbers.map(roomDocuments)),
      Promise.all(roomNumbers.map(contractsForRoom)),
    ]);
    const newRoomIndex = roomNumbers.indexOf(normalized.roomNumber);
    const newRoomContracts = contractSnapshots[newRoomIndex];
    const anotherActiveContract = newRoomContracts.docs.some(
      (item) => item.id !== id && item.data().status === "กำลังเช่า",
    );

    if (!roomSnapshots[newRoomIndex].size) {
      throw new Error(`ไม่พบห้อง ${normalized.roomNumber} ในรายการห้องพัก`);
    }
    if (normalized.status === "กำลังเช่า" && anotherActiveContract) {
      throw new Error(`ห้อง ${normalized.roomNumber} มีสัญญาที่กำลังเช่าอยู่แล้ว`);
    }

    const batch = writeBatch(db);
    batch.update(contractRef, {
      ...normalized,
      updatedAt: serverTimestamp(),
    });

    roomNumbers.forEach((roomNumber, index) => {
      const hasActiveContract = contractSnapshots[index].docs.some(
        (item) => item.id !== id && item.data().status === "กำลังเช่า",
      ) || (
        roomNumber === normalized.roomNumber
        && normalized.status === "กำลังเช่า"
      );
      updateRoomAvailability(batch, roomSnapshots[index], hasActiveContract);
    });

    await batch.commit();
  };

  const removeContract = async (id) => {
    const contractRef = doc(db, "contracts", id);
    const currentSnapshot = await getDoc(contractRef);
    if (!currentSnapshot.exists()) {
      return;
    }

    const roomNumber = currentSnapshot.data().roomNumber;
    const [roomSnapshot, roomContracts] = await Promise.all([
      roomDocuments(roomNumber),
      contractsForRoom(roomNumber),
    ]);
    const hasActiveContract = roomContracts.docs.some(
      (item) => item.id !== id && item.data().status === "กำลังเช่า",
    );
    const batch = writeBatch(db);
    batch.delete(contractRef);
    updateRoomAvailability(batch, roomSnapshot, hasActiveContract);
    await batch.commit();
  };

  const normalizeBill = (bill) => {
    const rent = Number(bill.rent) || 0;
    const water = Number(bill.water) || 0;
    const electricity = Number(bill.electricity) || 0;
    const otherExpenses = Number(bill.otherExpenses) || 0;

    return {
      tenantEmail: normalizeEmail(bill.tenantEmail),
      period: bill.period.trim(),
      rent,
      water,
      electricity,
      otherExpenses,
      total: rent + water + electricity + otherExpenses,
      dueDate: bill.dueDate.trim(),
    };
  };

  const addBill = async (bill) => {
    return addDoc(collection(db, "bills"), {
      ...normalizeBill(bill),
      status: "ค้างชำระ",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateBill = async (id, bill) => {
    return updateDoc(doc(db, "bills", id), {
      ...normalizeBill(bill),
      updatedAt: serverTimestamp(),
    });
  };

  const removeBill = async (id) => {
    return deleteDoc(doc(db, "bills", id));
  };

  const setBillPaid = async (id) => {
    return updateDoc(doc(db, "bills", id), {
      status: "ชำระแล้ว",
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const addComplaint = async (complaint) => {
    const tenantEmail = isAdmin
      ? normalizeEmail(complaint.tenantEmail)
      : normalizeEmail(user?.email);

    return addDoc(collection(db, "complaints"), {
      tenantEmail,
      roomNumber: complaint.roomNumber.trim(),
      title: complaint.title.trim(),
      description: complaint.description.trim(),
      status: "รอดำเนินการ",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateComplaint = async (id, changes) => {
    const complaintUpdates = {
      status: changes.status,
      updatedAt: serverTimestamp(),
    };

    if (changes.tenantEmail) {
      complaintUpdates.tenantEmail = normalizeEmail(changes.tenantEmail);
    }
    if (changes.roomNumber) {
      complaintUpdates.roomNumber = changes.roomNumber.trim();
    }
    if (changes.title) {
      complaintUpdates.title = changes.title.trim();
    }
    if (changes.description) {
      complaintUpdates.description = changes.description.trim();
    }

    return updateDoc(doc(db, "complaints", id), {
      ...complaintUpdates,
    });
  };

  const removeComplaint = async (id) => {
    return deleteDoc(doc(db, "complaints", id));
  };

  const value = useMemo(
    () => ({
      ...data,
      loading,
      error,
      addTenant,
      updateTenant,
      removeTenant,
      addContract,
      updateContract,
      removeContract,
      addBill,
      updateBill,
      removeBill,
      setBillPaid,
      addComplaint,
      updateComplaint,
      removeComplaint,
    }),
    [data, loading, error, user, isAdmin],
  );

  return (
    <DormContext.Provider value={value}>
      {children}
    </DormContext.Provider>
  );
}

export function useDorm() {
  const context = useContext(DormContext);

  if (!context) {
    throw new Error("useDorm ต้องถูกเรียกภายใน DormProvider");
  }

  return context;
}
