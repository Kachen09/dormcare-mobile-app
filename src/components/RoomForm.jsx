import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRooms } from "../contexts/RoomContext";
import styles from "../styles/appStyles";

const emptyRoom = {
  roomNumber: "",
  floor: "",
  roomType: "ห้องธรรมดา",
  price: "",
  status: "ว่าง",
};

const roomFields = [
  { name: "roomNumber", label: "เลขห้อง"},
  { name: "floor", label: "ชั้น"},
  { name: "price", label: "ราคา / เดือน"},
];

const roomTypes = ["ห้องธรรมดา", "ห้องแอร์", "ห้องพิเศษ"];
const roomStatuses = ["ว่าง", "มีผู้เช่า"];

function ChoiceGroup({ label, options, value, onChange }) {
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {options.map((option) => {
          const selected = value === option;

          return (
            <Pressable
              key={option}
              style={[styles.choice, selected && styles.choiceActive]}
              onPress={() => onChange(option)}
            >
              <Text
                style={selected ? styles.choiceTextActive : styles.choiceText}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );
}

export default function RoomForm({ room, onCancel, onSaved }) {
  const { addRoom, updateRoom } = useRooms();
  const [form, setForm] = useState(room || emptyRoom);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const setField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const save = async () => {
    if (!form.roomNumber.trim() || !form.floor || !form.price) {
      setError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (room?.id) {
        await updateRoom(room.id, form);
      } else {
        await addRoom(form);
      }

      onSaved();
    } catch {
      setError("บันทึกข้อมูลไม่สำเร็จ กรุณาตรวจสอบสิทธิ์หรือการเชื่อมต่อ");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.formBox}>
      <Text style={styles.sectionTitle}>
        {room ? "แก้ไขห้องพัก" : "เพิ่มห้องพัก"}
      </Text>

      {roomFields.map((field) => (
        <View key={field.name}>
          <Text style={styles.fieldLabel}>{field.label}</Text>
          <TextInput
            style={styles.input}
            placeholder={field.placeholder}
            placeholderTextColor="#777777"
            keyboardType={
              field.name === "roomNumber" ? "default" : "numeric"
            }
            value={String(form[field.name] ?? "")}
            onChangeText={(value) => setField(field.name, value)}
          />
        </View>
      ))}

      <ChoiceGroup
        label="ประเภทห้อง"
        options={roomTypes}
        value={form.roomType}
        onChange={(value) => setField("roomType", value)}
      />
      <ChoiceGroup
        label="สถานะ"
        options={roomStatuses}
        value={form.status}
        onChange={(value) => setField("status", value)}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.formActions}>
        <Pressable style={styles.secondaryButton} onPress={onCancel}>
          <Text>ยกเลิก</Text>
        </Pressable>
        <Pressable
          style={styles.primaryButtonSmall}
          onPress={save}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>บันทึก</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
