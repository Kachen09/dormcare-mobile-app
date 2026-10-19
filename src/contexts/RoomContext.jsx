import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { useAuth } from "./AuthContext";

const RoomContext = createContext(null);
const roomsCollection = collection(db, "rooms");

export function RoomProvider({ children }) {
  const { user } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setRooms([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    setError("");

    const roomsQuery = query(roomsCollection, orderBy("roomNumber"));
    const unsubscribe = onSnapshot(
      roomsQuery,
      (snapshot) => {
        const roomRecords = snapshot.docs.map((item) => ({
          id: item.id,
          ...item.data(),
        }));

        setRooms(roomRecords);
        setLoading(false);
      },
      (snapshotError) => {
        setError(snapshotError.message || "ไม่สามารถโหลดข้อมูลห้องพักได้");
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  const addRoom = async (room) => {
    return addDoc(roomsCollection, {
      roomNumber: room.roomNumber.trim(),
      floor: Number(room.floor),
      roomType: room.roomType,
      price: Number(room.price),
      status: room.status,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateRoom = async (id, room) => {
    return updateDoc(doc(db, "rooms", id), {
      roomNumber: room.roomNumber.trim(),
      floor: Number(room.floor),
      roomType: room.roomType,
      price: Number(room.price),
      status: room.status,
      updatedAt: serverTimestamp(),
    });
  };

  const removeRoom = async (id) => {
    return deleteDoc(doc(db, "rooms", id));
  };

  const value = useMemo(
    () => ({
      rooms,
      loading,
      error,
      addRoom,
      updateRoom,
      removeRoom,
    }),
    [rooms, loading, error],
  );

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRooms() {
  const context = useContext(RoomContext);

  if (!context) {
    throw new Error("useRooms ต้องถูกเรียกภายใน RoomProvider");
  }

  return context;
}
