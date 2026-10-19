import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { useDorm } from "../contexts/DormContext";
import { useAuth } from "../contexts/AuthContext";
import { useRooms } from "../contexts/RoomContext";
import RecordFormModal from "../components/RecordFormModal";
import styles from "../styles/appStyles";

const formFields = {
  tenants: [
    { name: "name", label: "ชื่อผู้เช่า" },
    { name: "email", label: "อีเมล", email: true, keyboardType: "email-address" },
    { name: "phone", label: "เบอร์โทรศัพท์", keyboardType: "phone-pad" },
    { name: "password", label: "รหัสผ่านเริ่มต้น", secureTextEntry: true },
    { name: "confirmPassword", label: "ยืนยันรหัสผ่าน", secureTextEntry: true },
  ],
  contracts: [
    { name: "tenantEmail", label: "อีเมลผู้เช่า", email: true, keyboardType: "email-address" },
    { name: "roomNumber", label: "เลขห้อง" },
    { name: "startDate", label: "วันเริ่มสัญญา (YYYY-MM-DD)" },
    { name: "endDate", label: "วันสิ้นสุดสัญญา (YYYY-MM-DD)" },
    { name: "monthlyRent", label: "ค่าเช่าต่อเดือน", keyboardType: "numeric" },
    { name: "status", label: "สถานะสัญญา", options: ["กำลังเช่า", "สิ้นสุดแล้ว"] },
  ],
  bills: [
    { name: "tenantEmail", label: "อีเมลผู้เช่า", email: true, keyboardType: "email-address" },
    { name: "period", label: "รอบบิล (YYYY-MM)" },
    { name: "rent", label: "ค่าเช่า", keyboardType: "numeric" },
    { name: "water", label: "ค่าน้ำ", keyboardType: "numeric" },
    { name: "electricity", label: "ค่าไฟ", keyboardType: "numeric" },
    { name: "otherExpenses", label: "ค่าใช้จ่ายอื่น ๆ", keyboardType: "numeric", defaultValue: "0", required: false },
    { name: "dueDate", label: "วันครบกำหนด (YYYY-MM-DD)" },
  ],
  complaints: [
    { name: "roomNumber", label: "เลขห้อง" },
    { name: "title", label: "หัวข้อปัญหา" },
    { name: "description", label: "รายละเอียด", multiline: true },
  ],
};

const tenantEditFields = formFields.tenants.filter(
  (field) => field.name !== "password" && field.name !== "confirmPassword",
);

const titles = {
  tenants: "ข้อมูลผู้เช่า",
  contracts: "สัญญาเช่า",
  bills: "บิลค่าใช้จ่าย",
  complaints: "รายการแจ้งปัญหา",
  portal: "พอร์ทัลผู้เช่า",
  myBills: "บิลของฉัน",
  myComplaints: "แจ้งปัญหา / ติดตามงาน",
};

function money(amount) {
  return `${Number(amount || 0).toLocaleString()} บาท`;
}

function formatDate(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value?.toDate) {
    return value.toDate().toLocaleDateString("th-TH");
  }

  return "-";
}

function ActionButton({ label, onPress, danger = false, secondary = false }) {
  const buttonStyles = [
    styles.recordAction,
    danger && styles.recordActionDanger,
    secondary && styles.recordActionSecondary,
  ];
  const labelStyles = [
    styles.recordActionText,
    danger && styles.deleteText,
    secondary && styles.recordActionSecondaryText,
  ];

  return (
    <Pressable style={buttonStyles} onPress={onPress}>
      <Text style={labelStyles}>{label}</Text>
    </Pressable>
  );
}

function RecordCard({ title, subtitle, children, actions }) {
  return (
    <View style={styles.recordCard}>
      <View style={styles.recordCardHeading}>
        <View style={styles.roomInfo}>
          <Text style={styles.recordTitle}>{title}</Text>
      {subtitle ? (
        <Text style={styles.roomDetail}>{subtitle}</Text>
      ) : null}
        </View>
      </View>
      {children}
      {actions?.length ? (
        <View style={styles.recordActions}>{actions}</View>
      ) : null}
    </View>
  );
}

export default function RecordsScreen({ page, isAdmin, currentEmail, currentName }) {
  const dorm = useDorm();
  const { rooms } = useRooms();
  const { changePassword } = useAuth();
  const [editing, setEditing] = useState(null);
  const [expandedBillId, setExpandedBillId] = useState(null);
  const [billsExpanded, setBillsExpanded] = useState(true);
  const [complaintsExpanded, setComplaintsExpanded] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const email = (currentEmail || "").trim().toLowerCase();
  const tenant = dorm.tenants.find(
    (item) => item.email?.trim().toLowerCase() === email,
  );
  const personalContracts = dorm.contracts.filter(
    (item) => item.tenantEmail?.trim().toLowerCase() === email,
  );
  const personalBills = dorm.bills.filter(
    (item) => item.tenantEmail?.trim().toLowerCase() === email,
  );
  const personalComplaints = dorm.complaints.filter(
    (item) => item.tenantEmail?.trim().toLowerCase() === email,
  );
  const activeContract = personalContracts.find(
    (item) => item.status === "กำลังเช่า",
  ) || personalContracts[0];
  const tenantRoom = rooms.find(
    (item) => item.roomNumber === activeContract?.roomNumber,
  );
  const tenantEmails = useMemo(
    () => [...new Set(
      dorm.tenants
        .map((item) => item.email?.trim().toLowerCase())
        .filter(Boolean),
    )],
    [dorm.tenants],
  );
  const availableRoomNumbers = useMemo(
    () => rooms
      .filter((item) => item.status === "ว่าง")
      .map((item) => String(item.roomNumber)),
    [rooms],
  );
  const allRoomNumbers = useMemo(
    () => rooms
      .filter((item) => item.roomNumber !== undefined && item.roomNumber !== null)
      .map((item) => String(item.roomNumber)),
    [rooms],
  );
  const contractFields = useMemo(() => {
    const roomOptions = [...availableRoomNumbers];
    if (
      editing?.record?.roomNumber
      && !roomOptions.includes(String(editing.record.roomNumber))
    ) {
      roomOptions.push(String(editing.record.roomNumber));
    }

    return formFields.contracts.map((field) => {
      if (field.name === "tenantEmail") {
        const options = [...tenantEmails];
        if (editing?.record?.tenantEmail && !options.includes(editing.record.tenantEmail)) {
          options.push(editing.record.tenantEmail);
        }
        return { ...field, options };
      }
      if (field.name === "roomNumber") {
        return { ...field, options: roomOptions };
      }
      return field;
    });
  }, [availableRoomNumbers, tenantEmails, editing?.record]);
  const billFields = useMemo(
    () => formFields.bills.map((field) =>
      field.name === "tenantEmail" ? { ...field, options: tenantEmails } : field,
    ),
    [tenantEmails],
  );
  const adminComplaintFields = useMemo(() => {
    const tenantEmailField = {
      name: "tenantEmail",
      label: "อีเมลผู้เช่า",
      email: true,
      options: [...tenantEmails],
    };
    const roomOptions = [...allRoomNumbers];

    if (
      editing?.record?.roomNumber
      && !roomOptions.includes(String(editing.record.roomNumber))
    ) {
      roomOptions.push(String(editing.record.roomNumber));
    }

    return [
      tenantEmailField,
      ...formFields.complaints.map((field) =>
        field.name === "roomNumber" ? { ...field, options: roomOptions } : field,
      ),
    ];
  }, [allRoomNumbers, tenantEmails, editing?.record]);
  const tenantComplaintFields = useMemo(
    () => formFields.complaints.map((field) =>
      field.name === "roomNumber"
        ? {
            ...field,
            options: activeContract?.roomNumber
              ? [String(activeContract.roomNumber)]
              : [],
            defaultValue: activeContract?.roomNumber || "",
          }
        : field,
    ),
    [activeContract],
  );

  const recordsByPage = {
    tenants: dorm.tenants,
    contracts: dorm.contracts,
    bills: isAdmin ? dorm.bills : personalBills,
    myBills: personalBills,
    complaints: dorm.complaints,
    myComplaints: personalComplaints,
  };
  const records = recordsByPage[page] || [];

  const startCreate = (kind) => setEditing({ kind, record: null });
  const save = async (form) => {
    const { kind, record } = editing;
    if (kind === "tenants") {
      return record
        ? dorm.updateTenant(record.id, form)
        : dorm.addTenant(form);
    }

    if (kind === "contracts") {
      return record
        ? dorm.updateContract(record.id, form)
        : dorm.addContract(form);
    }

    if (kind === "bills") {
      return record
        ? dorm.updateBill(record.id, form)
        : dorm.addBill(form);
    }

    const complaint = { ...form, tenantEmail: isAdmin ? form.tenantEmail : email };
    if (record) return dorm.updateComplaint(record.id, complaint);
    return dorm.addComplaint(complaint);
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert("ข้อมูลไม่ครบ", "กรุณากรอกรหัสผ่านให้ครบทุกช่อง");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("รหัสผ่านสั้นเกินไป", "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      Alert.alert("รหัสผ่านไม่ตรงกัน", "กรุณาตรวจรหัสผ่านใหม่ทั้งสองช่อง");
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      Alert.alert("เปลี่ยนรหัสผ่านแล้ว", "ใช้รหัสผ่านใหม่เข้าสู่ระบบครั้งถัดไป");
    } catch (passwordError) {
      const message = passwordError.code === "auth/invalid-credential"
        ? "รหัสผ่านปัจจุบันไม่ถูกต้อง"
        : passwordError.code === "auth/weak-password"
          ? "รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร"
          : "เปลี่ยนรหัสผ่านไม่สำเร็จ กรุณาเข้าสู่ระบบใหม่แล้วลองอีกครั้ง";
      Alert.alert("เกิดข้อผิดพลาด", message);
    } finally {
      setPasswordSaving(false);
    }
  };

  const remove = (kind, item) => {
    Alert.alert("ยืนยันการลบ", "ต้องการลบรายการนี้ใช่หรือไม่?", [
      { text: "ยกเลิก", style: "cancel" },
      {
        text: "ลบ",
        style: "destructive",
        onPress: () => {
          if (kind === "tenants") dorm.removeTenant(item.id);
          if (kind === "contracts") dorm.removeContract(item.id);
          if (kind === "bills") dorm.removeBill(item.id);
          if (kind === "complaints") dorm.removeComplaint(item.id);
        },
      },
    ]);
  };

  const editActions = (kind, item) => [
    <ActionButton
      key="edit"
      label="แก้ไข"
      onPress={() => setEditing({ kind, record: item })}
    />,
    <ActionButton
      key="delete"
      label="ลบ"
      danger
      onPress={() => remove(kind, item)}
    />,
  ];

  const renderTenant = (item) => (
    <RecordCard
      key={item.id}
      title={item.name}
      subtitle={item.email}
      actions={editActions("tenants", item)}
    >
      <Text style={styles.recordText}>
        โทร. {item.phone || "ไม่ได้ระบุ"}
      </Text>
    </RecordCard>
  );

  const renderContract = (item, manageable = true) => (
    <RecordCard
      key={item.id}
      title={`ห้อง ${item.roomNumber}`}
      subtitle={item.tenantEmail}
      actions={
        manageable && isAdmin ? editActions("contracts", item) : undefined
      }
    >
      <Text style={styles.recordText}>
        ระยะสัญญา {item.startDate} ถึง {item.endDate}
      </Text>
      <Text style={styles.recordText}>
        ค่าเช่า {money(item.monthlyRent)} / เดือน · {item.status}
      </Text>
    </RecordCard>
  );

  const renderBill = (item, manageable = true, showDetailsToggle = false) => {
    const actions = [];
    const detailsExpanded = !showDetailsToggle || expandedBillId === item.id;
    if (manageable && isAdmin) {
      actions.push(...editActions("bills", item));
    }

    if (item.status !== "ชำระแล้ว" && isAdmin) {
      actions.push(
        <ActionButton
          key="paid"
          label="บันทึกว่าชำระแล้ว"
          secondary
          onPress={() => dorm.setBillPaid(item.id)}
        />,
      );
    }

    return (
      <RecordCard
        key={item.id}
        title={`บิล ${item.period}`}
        subtitle={item.tenantEmail}
        actions={actions}
      >
        {detailsExpanded ? (
          <View style={styles.billDetails}>
            <Text style={styles.billDetailRow}>ค่าเช่า {money(item.rent)}</Text>
            <Text style={styles.billDetailRow}>ค่าน้ำ {money(item.water)}</Text>
            <Text style={styles.billDetailRow}>ค่าไฟ {money(item.electricity)}</Text>
            <Text style={styles.billDetailRow}>
              ค่าใช้จ่ายอื่น ๆ {money(item.otherExpenses)}
            </Text>
          </View>
        ) : null}
        <Text style={styles.recordTotal}>รวม {money(item.total)}</Text>
        <View style={styles.recordMetaRow}>
          <Text
            style={item.status === "ชำระแล้ว" ? styles.available : styles.rented}
          >
            {item.status}
          </Text>
          <Text style={styles.roomDetail}>ครบกำหนด {item.dueDate}</Text>
        </View>
        {showDetailsToggle ? (
          <ActionButton
            label={detailsExpanded ? "ซ่อนรายละเอียดบิล" : "ดูรายละเอียดบิล"}
            secondary
            onPress={() => setExpandedBillId(
              detailsExpanded ? null : item.id,
            )}
          />
        ) : null}
      </RecordCard>
    );
  };

  const renderComplaint = (item, manageable = true) => {
    const actions = [];

    if (manageable && isAdmin) {
      if (item.status !== "กำลังดำเนินการ") {
        actions.push(
          <ActionButton
            key="working"
            label="รับดำเนินการ"
            onPress={() =>
              dorm.updateComplaint(item.id, { status: "กำลังดำเนินการ" })
            }
          />,
        );
      }

      if (item.status !== "เสร็จแล้ว") {
        actions.push(
          <ActionButton
            key="done"
            label="เสร็จแล้ว"
            secondary
            onPress={() => dorm.updateComplaint(item.id, { status: "เสร็จแล้ว" })}
          />,
        );
      }

      actions.push(...editActions("complaints", item));
    }

    return (
      <RecordCard
        key={item.id}
        title={item.title}
        subtitle={`ห้อง ${item.roomNumber} · ${item.tenantEmail}`}
        actions={actions}
      >
        <Text style={styles.recordText}>{item.description}</Text>
        <View style={styles.recordMetaRow}>
          <Text
            style={item.status === "เสร็จแล้ว" ? styles.available : styles.rented}
          >
            {item.status}
          </Text>
          <Text style={styles.roomDetail}>{formatDate(item.createdAt)}</Text>
        </View>
      </RecordCard>
    );
  };

  let kind = page;
  if (page === "myBills") kind = "bills";
  if (page === "myComplaints") kind = "complaints";
  let content;

  if (page === "portal") {
    kind = "complaints";
    content = <>
      <View style={styles.portalWelcome}>
        <Text style={styles.welcomeTitle}>
          สวัสดี {tenant?.name || currentName || email}
        </Text>
        <Text style={styles.welcomeText}>ข้อมูลห้องพัก บิล และแจ้งปัญหาของคุณ</Text>
      </View>
      <Text style={styles.sectionTitle}>ห้องพักของฉัน</Text>
      {activeContract ? (
        <RecordCard title={`ห้อง ${activeContract.roomNumber}`}>
          <Text style={styles.recordText}>
            ชั้น / ประเภท {tenantRoom
              ? `${tenantRoom.floor} / ${tenantRoom.roomType}`
              : "ยังไม่มีข้อมูล"}
          </Text>
          <Text style={styles.recordText}>
            ค่าเช่า {money(activeContract.monthlyRent)} / เดือน
          </Text>
          <Text style={styles.recordText}>
            สัญญาถึง {formatDate(activeContract.endDate)}
          </Text>
          {tenant ? (
            <Text style={styles.roomDetail}>
              {tenant.email} · {tenant.phone || "ไม่ได้ระบุเบอร์โทร"}
            </Text>
          ) : null}
        </RecordCard>
      ) : (
        <Text style={styles.empty}>ยังไม่มีข้อมูลห้องพักหรือสัญญาเช่า</Text>
      )}
      <View style={styles.collapsibleHeader}>
        <Text style={[styles.sectionTitle, styles.collapsibleSectionTitle]}>
          บิลของฉัน ({personalBills.length})
        </Text>
        <Pressable onPress={() => setBillsExpanded((current) => !current)}>
          <Text style={styles.actionText}>
            {billsExpanded ? "ย่อรายการ" : "แสดงรายการ"}
          </Text>
        </Pressable>
      </View>
      {billsExpanded ? (
        personalBills.length ? (
          personalBills.map((item) => renderBill(item, false, true))
        ) : (
          <Text style={styles.empty}>ยังไม่มีบิล</Text>
        )
      ) : null}
      <View style={styles.collapsibleHeader}>
        <Text style={[styles.sectionTitle, styles.collapsibleSectionTitle]}>
          แจ้งปัญหา ({personalComplaints.length})
        </Text>
        <Pressable
          onPress={() => setComplaintsExpanded((current) => !current)}
        >
          <Text style={styles.actionText}>
            {complaintsExpanded ? "ย่อรายการ" : "แสดงรายการ"}
          </Text>
        </Pressable>
      </View>
      {complaintsExpanded ? (
        <>
          <Text style={styles.roomDetail}>
            ส่งรายละเอียดปัญหาให้ผู้ดูแลหอพักตรวจสอบ
          </Text>
          <ActionButton
            label="+ แจ้งปัญหา"
            onPress={() => startCreate("complaints")}
          />
          <Text style={styles.fieldLabel}>ประวัติแจ้งปัญหา</Text>
          {personalComplaints.length ? (
            personalComplaints.map((item) => renderComplaint(item, false))
          ) : (
            <Text style={styles.empty}>ยังไม่มีรายการแจ้งปัญหา</Text>
          )}
        </>
      ) : null}
      <View style={styles.passwordPanel}>
        <Text style={styles.recordTitle}>เปลี่ยนรหัสผ่าน</Text>
        <TextInput
          style={styles.input}
          placeholder="รหัสผ่านปัจจุบัน"
          placeholderTextColor="#777777"
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="รหัสผ่านใหม่"
          placeholderTextColor="#777777"
          secureTextEntry
          value={newPassword}
          onChangeText={setNewPassword}
        />
        <TextInput
          style={styles.input}
          placeholder="ยืนยันรหัสผ่านใหม่"
          placeholderTextColor="#777777"
          secureTextEntry
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
        />
        <Pressable
          style={styles.primaryButton}
          onPress={savePassword}
          disabled={passwordSaving}
        >
          <Text style={styles.buttonText}>
            {passwordSaving ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}
          </Text>
        </Pressable>
      </View>
    </>;
  } else if (page === "tenants") {
    content = <>
      <ActionButton
        label="+ เพิ่มผู้เช่า"
        onPress={() => startCreate("tenants")}
      />
      {records.map(renderTenant)}
    </>;
  } else if (page === "contracts") {
    content = <>
      <ActionButton
        label="+ เพิ่มสัญญา"
        onPress={() => setEditing({ kind: "contracts", record: null })}
      />
      {records.map((item) => renderContract(item))}
    </>;
  } else if (page === "bills" || page === "myBills") {
    kind = "bills";
    content = <>
      {isAdmin ? (
        <ActionButton label="+ สร้างบิล" onPress={() => startCreate("bills")} />
      ) : null}
      {records.map((item) => renderBill(item, isAdmin))}
    </>;
  } else if (page === "complaints" || page === "myComplaints") {
    kind = "complaints";
    content = <>
      {!isAdmin ? (
        <ActionButton
          label="+ แจ้งปัญหา"
          onPress={() => startCreate("complaints")}
        />
      ) : null}
      {records.map((item) => renderComplaint(item, isAdmin))}
    </>;
  }

  let fields = kind === "contracts"
    ? contractFields
    : kind === "bills"
      ? billFields
      : formFields[kind];
  if (editing?.kind === "tenants" && editing.record) {
    fields = tenantEditFields;
  }
  let initialValue = editing?.record;
  if (editing?.kind === "complaints" && isAdmin) {
    fields = adminComplaintFields;
  } else if (editing?.kind === "complaints") {
    fields = tenantComplaintFields;
  }

  return (
    <>
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentPadding}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.pageTitleRow}>
          <View style={styles.roomInfo}>
            <Text style={styles.sectionTitle}>{titles[page]}</Text>
            <Text style={styles.roomDetail}>
              {isAdmin ? "จัดการข้อมูลหอพัก" : "ข้อมูลและบริการสำหรับผู้เช่า"}
            </Text>
          </View>
        </View>
        {dorm.error ? <Text style={styles.error}>{dorm.error}</Text> : null}
        {content}
        {page !== "portal" && !records.length ? (
          <Text style={styles.empty}>ยังไม่มีข้อมูลรายการนี้</Text>
        ) : null}
        <View style={styles.bottomSpace} />
      </ScrollView>
      <RecordFormModal
        visible={Boolean(editing)}
        title={`${editing?.record ? "แก้ไข" : "เพิ่ม"}${titles[editing?.kind || kind]}`}
        fields={fields || []}
        initialValue={initialValue}
        onClose={() => setEditing(null)}
        onSave={save}
      />
    </>
  );
}
