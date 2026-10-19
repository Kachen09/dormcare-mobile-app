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
import styles from "../styles/appStyles";

export default function RecordFormModal({ visible, title, fields, initialValue, onClose, onSave }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [openField, setOpenField] = useState(null);

  useEffect(() => {
    if (visible) {
      const defaults = Object.fromEntries(fields.map((field) => [field.name, field.defaultValue ?? ""]));
      setForm({ ...defaults, ...(initialValue || {}) });
      setError("");
      setOpenField(null);
    }
  }, [visible, initialValue, fields]);

  const save = async () => {
    const missing = fields.find((field) => field.required !== false && !String(form[field.name] ?? "").trim());
    if (missing) {
      setError(`กรุณากรอก${missing.label}`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const result = await onSave(form);
      onClose();
      if (result?.accountCreated) {
        Alert.alert(
          "สร้างบัญชีผู้เช่าสำเร็จ",
          "แจ้งอีเมลและรหัสผ่านเริ่มต้นให้ผู้เช่าเพื่อเข้าสู่ระบบ",
        );
      }
    } catch (saveError) {
      setError(saveError.message || "บันทึกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable onPress={onClose}><Text style={styles.closeText}>×</Text></Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" style={styles.formScroll}>
            {fields.map((field) => (
              <View key={field.name}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                {field.options !== undefined ? (
                  field.options.length ? (
                  <>
                    <Pressable
                      style={styles.selectInput}
                      onPress={() =>
                        setOpenField((current) =>
                          current === field.name ? null : field.name,
                        )
                      }
                    >
                      <Text style={form[field.name] ? styles.selectValue : styles.selectPlaceholder}>
                        {form[field.name] || "เลือก" + field.label}
                      </Text>
                      <Text style={styles.selectArrow}>
                        {openField === field.name ? "▲" : "▼"}
                      </Text>
                    </Pressable>
                    {openField === field.name ? (
                      <ScrollView
                        style={styles.optionList}
                        nestedScrollEnabled
                        keyboardShouldPersistTaps="handled"
                      >
                        {field.options.map((option) => (
                          <Pressable
                            key={option}
                            style={[
                              styles.optionRow,
                              form[field.name] === option && styles.optionSelected,
                            ]}
                            onPress={() => {
                              setForm((current) => ({
                                ...current,
                                [field.name]: option,
                              }));
                              setOpenField(null);
                            }}
                          >
                            <Text style={styles.selectValue}>{option}</Text>
                          </Pressable>
                        ))}
                      </ScrollView>
                    ) : null}
                  </>
                  ) : (
                    <View style={styles.selectInput}>
                      <Text style={styles.selectPlaceholder}>
                        ยังไม่มี{field.label}ให้เลือก
                      </Text>
                    </View>
                  )
                ) : (
                  <TextInput
                    style={[styles.input, field.multiline && styles.multilineInput]}
                    placeholder={field.placeholder || field.label}
                    placeholderTextColor="#777777"
                    value={String(form[field.name] ?? "")}
                    onChangeText={(value) => setForm((current) => ({ ...current, [field.name]: value }))}
                    keyboardType={field.keyboardType || "default"}
                    autoCapitalize={
                      field.email || field.secureTextEntry ? "none" : "sentences"
                    }
                    secureTextEntry={Boolean(field.secureTextEntry)}
                    multiline={Boolean(field.multiline)}
                  />
                )}
              </View>
            ))}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <View style={styles.formActions}>
              <Pressable style={styles.secondaryButton} onPress={onClose}><Text>ยกเลิก</Text></Pressable>
              <Pressable style={styles.primaryButtonSmall} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>บันทึก</Text>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
