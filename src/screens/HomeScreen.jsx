import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuth } from "../contexts/AuthContext";
import { useDorm } from "../contexts/DormContext";
import { useRooms } from "../contexts/RoomContext";
import RecordsScreen from "./RecordsScreen";
import RoomForm from "../components/RoomForm";
import styles from "../styles/appStyles";

const pageLabels = {
  dashboard: "ภาพรวม",
  rooms: "ห้องพัก",
  tenants: "ผู้เช่า",
  contracts: "สัญญา",
  bills: "บิล",
  complaints: "แจ้งปัญหา",
  portal: "หน้าผู้เช่า",
  myBills: "บิลของฉัน",
  myComplaints: "แจ้งปัญหา",
};

function SummaryCard({ label, value, detail, dark = false }) {
  return <View style={[styles.statCard, dark && styles.statDark]}>
    <Text style={dark ? styles.statLabelLight : styles.statLabel}>{label}</Text>
    <Text style={dark ? styles.statValueLight : styles.statValue}>{value}</Text>
    <Text style={dark ? styles.statDetailLight : styles.statDetail}>{detail}</Text>
  </View>;
}

export default function HomeScreen() {
  const { user, logout, role, isAdmin } = useAuth();
  const { rooms, loading: roomsLoading, error, removeRoom } = useRooms();
  const dorm = useDorm();
  const [page, setPage] = useState(isAdmin ? "dashboard" : "portal");
  const [search, setSearch] = useState("");
  const [editingRoom, setEditingRoom] = useState(null);
  const [detailRoom, setDetailRoom] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const tenantEmail = (user?.email || "").trim().toLowerCase();

  const pages = isAdmin
    ? ["dashboard", "rooms", "tenants", "contracts", "bills", "complaints"]
    : ["portal"];
  const normalizedSearch = search.toLowerCase();
  const filteredRooms = rooms.filter((room) => {
    const searchableFields = [
      room.roomNumber,
      room.floor,
      room.roomType,
      room.status,
    ];

    return searchableFields.join(" ").toLowerCase().includes(normalizedSearch);
  });
  const availableRooms = rooms.filter((room) => room.status === "ว่าง").length;
  const rentedRooms = rooms.filter((room) => room.status === "มีผู้เช่า").length;
  const pendingBills = dorm.bills.filter((bill) => bill.status !== "ชำระแล้ว");
  const billedTotal = dorm.bills.reduce((total, bill) => total + Number(bill.total || 0), 0);
  const paidTotal = dorm.bills
    .filter((bill) => bill.status === "ชำระแล้ว")
    .reduce((total, bill) => total + Number(bill.total || 0), 0);
  const openComplaints = dorm.complaints.filter((item) => item.status !== "เสร็จแล้ว");

  useEffect(() => {
    if (isAdmin && ["portal", "myBills", "myComplaints"].includes(page)) setPage("dashboard");
    if (
      !isAdmin &&
      ["dashboard", "rooms", "tenants", "contracts", "bills", "complaints", "add"].includes(page)
    ) {
      setPage("portal");
    }
  }, [isAdmin, page]);

  const deleteRoom = (room) => Alert.alert("ลบห้องพัก", `ต้องการลบห้อง ${room.roomNumber} ใช่หรือไม่?`, [
    { text: "ยกเลิก", style: "cancel" },
    {
      text: "ลบ",
      style: "destructive",
      onPress: () => removeRoom(room.id).catch(() => {
        Alert.alert("ผิดพลาด", "ลบข้อมูลไม่สำเร็จ");
      }),
    },
  ]);

  const renderRoom = (room) => <View key={room.id} style={styles.roomRow}>
    <Pressable style={styles.roomInfo} onPress={() => setDetailRoom(room)}>
      <Text style={styles.roomTitle}>ห้อง {room.roomNumber}</Text>
      <Text style={styles.roomDetail}>{room.roomType} · ชั้น {room.floor}</Text>
      <Text style={styles.recordText}>{Number(room.price || 0).toLocaleString()} บาท / เดือน</Text>
    </Pressable>
    <View style={styles.roomActions}>
      <Text style={room.status === "ว่าง" ? styles.available : styles.rented}>
        {room.status || "ไม่ระบุ"}
      </Text>
      {isAdmin && page === "rooms" ? (
        <>
          <Pressable onPress={() => setEditingRoom(room)}>
            <Text style={styles.actionText}>แก้ไข</Text>
          </Pressable>
          <Pressable onPress={() => deleteRoom(room)}>
            <Text style={styles.deleteText}>ลบ</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  </View>;

  const goTo = (target) => {
    setPage(target);
    setEditingRoom(null);
    setShowNotifications(false);
  };

  return <SafeAreaView style={styles.safeArea}><View style={styles.container}>
    <View style={styles.header}>
      <View style={styles.headerIdentity}>
        <Text style={styles.eyebrow}>
          {isAdmin ? "DORMITORY MANAGEMENT" : "TENANT PORTAL"}
        </Text>
        <Text style={styles.title}>DORMCARE</Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {isAdmin ? `${user?.email} · ${role}` : "ข้อมูลห้องพัก บิล และแจ้งปัญหา"}
        </Text>
      </View>
      <View style={styles.headerActions}>
        {isAdmin ? (
          <>
            <Pressable style={styles.headerIcon} onPress={() => setShowNotifications(true)}>
              <MaterialCommunityIcons name="bell-outline" size={20} color="#171717" />
              {pendingBills.length + openComplaints.length > 0 ? (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText}>
                    {pendingBills.length + openComplaints.length}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          </>
        ) : null}
        <Pressable style={styles.logoutButton} onPress={logout}>
          <MaterialCommunityIcons name="logout" size={17} color="#b42318" />
          <Text style={styles.logout}>ออก</Text>
        </Pressable>
      </View>
    </View>

    {isAdmin ? <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.navScroll}
      contentContainerStyle={styles.menuRow}
    >
      {pages.map((key) => (
        <Pressable
          key={key}
          style={[styles.menuButton, page === key && styles.menuButtonActive]}
          onPress={() => goTo(key)}
        >
          <Text style={page === key ? styles.menuTextActive : styles.menuText}>
            {pageLabels[key]}
          </Text>
        </Pressable>
      ))}
    </ScrollView> : null}

    {dorm.loading ? (
      <View style={styles.loadingPanel}>
        <ActivityIndicator size="large" color="#111" />
        <Text style={styles.roomDetail}>กำลังโหลดข้อมูล...</Text>
      </View>
    ) : null}
    {!dorm.loading && dorm.error ? (
      <Text style={styles.error}>{dorm.error}</Text>
    ) : null}

    {!dorm.loading && page === "dashboard" ? (
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentPadding}
      >
        <View style={styles.welcomeBox}>
          <View style={styles.roomInfo}>
            <Text style={styles.welcomeTitle}>ภาพรวมการจัดการหอพัก</Text>
            <Text style={styles.welcomeText}>สรุปข้อมูลที่ต้องติดตาม</Text>
          </View>
          <Pressable style={styles.addButton} onPress={() => goTo("rooms")}>
            <Text style={styles.addButtonText}>ดูห้องพัก</Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <SummaryCard
            label="ห้องทั้งหมด"
            value={rooms.length}
            detail="ห้องพัก"
            dark
          />
          <SummaryCard
            label="ห้องว่าง"
            value={availableRooms}
            detail="พร้อมให้เช่า"
          />
          <SummaryCard label="มีผู้เช่า" value={rentedRooms} detail="ห้อง" />
        </View>
        <View style={styles.statsRow}>
          <SummaryCard
            label="ผู้เช่า"
            value={dorm.tenants.length}
            detail="บัญชีผู้เช่า"
          />
          <SummaryCard
            label="บิลค้างชำระ"
            value={pendingBills.length}
            detail="รายการ"
          />
          <SummaryCard
            label="ปัญหารอดำเนินการ"
            value={openComplaints.length}
            detail="รายการ"
          />
        </View>
        <View style={styles.statsRow}>
          <SummaryCard
            label="ยอดบิลทั้งหมด"
            value={billedTotal.toLocaleString()}
            detail="บาท"
          />
          <SummaryCard
            label="รับชำระแล้ว"
            value={paidTotal.toLocaleString()}
            detail="บาท"
          />
        </View>

        <View style={styles.quickLinks}>
          <Text style={styles.sectionTitle}>งานที่ต้องติดตาม</Text>
          <Pressable style={styles.quickLink} onPress={() => goTo("bills")}>
            <Text style={styles.quickLinkText}>
              ดูบิลค้างชำระ ({pendingBills.length})
            </Text>
            <Text style={styles.actionText}>เปิด ›</Text>
          </Pressable>
          <Pressable
            style={styles.quickLink}
            onPress={() => goTo("complaints")}
          >
            <Text style={styles.quickLinkText}>
              ดูรายการแจ้งปัญหา ({openComplaints.length})
            </Text>
            <Text style={styles.actionText}>เปิด ›</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>ห้องพักล่าสุด</Text>
        {rooms.slice(0, 4).map(renderRoom)}
        {!rooms.length ? (
          <Text style={styles.empty}>ยังไม่มีข้อมูลห้องพัก</Text>
        ) : null}
        <View style={styles.bottomSpace} />
      </ScrollView>
    ) : null}

    {!dorm.loading && page === "add" && isAdmin ? (
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={styles.contentPadding}
      >
        <RoomForm
          onCancel={() => goTo("rooms")}
          onSaved={() => goTo("rooms")}
        />
      </ScrollView>
    ) : null}

    {!dorm.loading && page === "rooms" ? (
      <View style={styles.roomPage}>
        {editingRoom ? (
          <ScrollView
            style={styles.roomFormScroll}
            keyboardShouldPersistTaps="handled"
          >
            <RoomForm
              key={editingRoom.id}
              room={editingRoom}
              onCancel={() => setEditingRoom(null)}
              onSaved={() => setEditingRoom(null)}
            />
          </ScrollView>
        ) : null}

        <TextInput
          style={styles.input}
          placeholder="ค้นหาห้องพัก..."
          placeholderTextColor="#777777"
          value={search}
          onChangeText={setSearch}
        />
        {isAdmin ? (
          <Pressable
            style={styles.addInlineButton}
            onPress={() => goTo("add")}
          >
            <Text style={styles.addButtonText}>+ เพิ่มห้องพัก</Text>
          </Pressable>
        ) : null}

        <Text style={styles.sectionTitle}>รายการห้องพัก</Text>
        {roomsLoading ? <ActivityIndicator size="large" color="#111" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ScrollView
          style={styles.contentScroll}
          keyboardShouldPersistTaps="handled"
        >
          {filteredRooms.map(renderRoom)}
          {!roomsLoading && !filteredRooms.length ? (
            <Text style={styles.empty}>ไม่พบข้อมูลห้องพัก</Text>
          ) : null}
          <View style={styles.bottomSpace} />
        </ScrollView>
      </View>
    ) : null}

    {!dorm.loading && pages.includes(page) && page !== "dashboard" && page !== "rooms" ? (
      <RecordsScreen
        page={page}
        isAdmin={isAdmin}
        currentEmail={user?.email}
        currentName={user?.displayName || user?.name}
      />
    ) : null}

    {detailRoom ? (
      <Modal
        visible
        transparent
        animationType="fade"
        onRequestClose={() => setDetailRoom(null)}
      >
      <Pressable style={styles.modalBackdrop} onPress={() => setDetailRoom(null)}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              รายละเอียดห้อง {detailRoom.roomNumber}
            </Text>
            <Pressable onPress={() => setDetailRoom(null)}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          <Text style={styles.recordText}>ชั้น {detailRoom.floor} · {detailRoom.roomType}</Text>
          <Text style={styles.recordText}>
            ราคา {Number(detailRoom.price || 0).toLocaleString()} บาท / เดือน
          </Text>
          <Text
            style={
              detailRoom.status === "ว่าง" ? styles.available : styles.rented
            }
          >
            {detailRoom.status}
          </Text>
        </View>
      </Pressable>
      </Modal>
    ) : null}

    <Modal
      visible={showNotifications}
      transparent
      animationType="fade"
      onRequestClose={() => setShowNotifications(false)}
    >
      <Pressable style={styles.modalBackdrop} onPress={() => setShowNotifications(false)}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>สิ่งที่ต้องติดตาม</Text>
            <Pressable onPress={() => setShowNotifications(false)}>
              <Text style={styles.closeText}>×</Text>
            </Pressable>
          </View>
          {!isAdmin ? (
            <Text style={styles.modalText}>
              ตรวจสอบบิลและสถานะรายการแจ้งปัญหาของคุณได้จากเมนูด้านบน
            </Text>
          ) : null}
          {isAdmin && !pendingBills.length && !openComplaints.length ? (
            <Text style={styles.modalText}>
              ไม่มีบิลค้างชำระหรือปัญหาที่รอดำเนินการ
            </Text>
          ) : null}
          {isAdmin && pendingBills.length ? (
            <>
              <Text style={styles.fieldLabel}>บิลค้างชำระ</Text>
              {pendingBills.slice(0, 3).map((bill) => (
                <Pressable
                  key={bill.id}
                  style={styles.notificationRow}
                  onPress={() => goTo("bills")}
                >
                  <Text style={styles.quickLinkText}>
                    {bill.tenantEmail} · {bill.period}
                  </Text>
                  <Text style={styles.rented}>
                    {Number(bill.total || 0).toLocaleString()} บาท
                  </Text>
                </Pressable>
              ))}
              <Pressable onPress={() => goTo("bills")}>
                <Text style={styles.actionText}>ดูบิลทั้งหมด ›</Text>
              </Pressable>
            </>
          ) : null}
          {isAdmin && openComplaints.length ? (
            <>
              <Text style={styles.fieldLabel}>รายการแจ้งปัญหา</Text>
              {openComplaints.slice(0, 3).map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.notificationRow}
                  onPress={() => goTo("complaints")}
                >
                  <Text style={styles.quickLinkText}>
                    {item.title} · ห้อง {item.roomNumber}
                  </Text>
                  <Text style={styles.rented}>{item.status}</Text>
                </Pressable>
              ))}
              <Pressable onPress={() => goTo("complaints")}>
                <Text style={styles.actionText}>ดูรายการทั้งหมด ›</Text>
              </Pressable>
            </>
          ) : null}
          <Pressable
            style={styles.modalButton}
            onPress={() => setShowNotifications(false)}
          >
            <Text style={styles.buttonText}>ปิด</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>

  </View></SafeAreaView>;
}
