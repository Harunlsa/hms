import { useState, useMemo } from "react";
import {
  Button,
  Timeline,
  Card,
  Tag,
  Typography,
  Space,
  Select,
  DatePicker,
  Empty,
  Divider,
  Collapse,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  PrinterOutlined,
  EditOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { Patient } from "../types/patient.types";
import { VisitType, VisitStatus } from "../types/visit.types";

const { RangePicker } = DatePicker;
const { Text, Title, Paragraph } = Typography;

interface Props {
  patient: Patient;
}

export function VisitsTab({ patient }: Props) {
  const [dateRange, setDateRange] = useState<
    [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  >(null);
  const [doctorFilter, setDoctorFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Get unique doctors for the filter
  const doctors = useMemo(() => {
    const uniqueDoctors = new Set(patient.visits.map((v) => v.doctorName));
    return Array.from(uniqueDoctors);
  }, [patient.visits]);

  const filteredVisits = useMemo(() => {
    return (patient.visits || []).filter((visit) => {
      // Date filter
      if (dateRange && dateRange[0] && dateRange[1]) {
        const visitDate = dayjs(visit.date);
        if (
          visitDate.isBefore(dateRange[0], "day") ||
          visitDate.isAfter(dateRange[1], "day")
        ) {
          return false;
        }
      }
      // Doctor filter
      if (doctorFilter !== "all" && visit.doctorName !== doctorFilter) {
        return false;
      }
      // Type filter
      if (typeFilter !== "all" && visit.type !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [patient.visits, dateRange, doctorFilter, typeFilter]);

  const getStatusColor = (status: VisitStatus) => {
    switch (status) {
      case "completed":
        return "success";
      case "ongoing":
        return "processing";
      case "cancelled":
        return "error";
      default:
        return "default";
    }
  };

  const getTypeColor = (type: VisitType) => {
    switch (type) {
      case "emergency":
        return "volcano";
      case "consultation":
        return "blue";
      case "follow-up":
        return "green";
      case "routine-checkup":
        return "cyan";
      default:
        return "default";
    }
  };

  return (
    <div style={{ padding: "0 24px" }}>
      {/* Filters & Actions */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <Space size="middle" wrap>
          <div>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 4 }}
            >
              Date Range
            </Text>
            <RangePicker
              onChange={(dates) => setDateRange(dates as any)}
              style={{ width: 280 }}
            />
          </div>
          <div>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 4 }}
            >
              Doctor
            </Text>
            <Select
              value={doctorFilter}
              onChange={setDoctorFilter}
              style={{ width: 180 }}
            >
              <Select.Option value="all">All Doctors</Select.Option>
              {doctors.map((doc) => (
                <Select.Option key={doc} value={doc}>
                  {doc}
                </Select.Option>
              ))}
            </Select>
          </div>
          <div>
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 4 }}
            >
              Visit Type
            </Text>
            <Select
              value={typeFilter}
              onChange={setTypeFilter}
              style={{ width: 150 }}
            >
              <Select.Option value="all">All Types</Select.Option>
              <Select.Option value="consultation">Consultation</Select.Option>
              <Select.Option value="emergency">Emergency</Select.Option>
              <Select.Option value="follow-up">Follow-up</Select.Option>
              <Select.Option value="routine-checkup">
                Routine Checkup
              </Select.Option>
            </Select>
          </div>
        </Space>

        <Button type="primary" icon={<PlusOutlined />}>
          Record Visit
        </Button>
      </div>

      <Divider />

      {filteredVisits.length === 0 ? (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="No visits match the current filters"
        />
      ) : (
        <Timeline
          mode="left"
          items={filteredVisits.map((visit) => ({
            label: (
              <div style={{ textAlign: "right", paddingRight: 12 }}>
                <Text strong>{dayjs(visit.date).format("MMM DD, YYYY")}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {dayjs(visit.date).format("h:mm A")}
                </Text>
              </div>
            ),
            children: (
              <Card
                size="small"
                hoverable
                style={{ marginBottom: 16 }}
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <Space>
                      <Text strong>{visit.reason}</Text>
                      <Tag color={getTypeColor(visit.type)}>
                        {visit.type.replace("-", " ")}
                      </Tag>
                    </Space>
                    <Tag color={getStatusColor(visit.status)}>
                      {visit.status}
                    </Tag>
                  </div>
                }
                extra={
                  <Space>
                    <Tooltip title="Edit Visit">
                      <Button
                        type="text"
                        icon={<EditOutlined />}
                        size="small"
                      />
                    </Tooltip>
                    <Tooltip title="Print Summary">
                      <Button
                        type="text"
                        icon={<PrinterOutlined />}
                        size="small"
                      />
                    </Tooltip>
                  </Space>
                }
              >
                <div style={{ marginBottom: 12 }}>
                  <Space direction="vertical" size={2} style={{ width: "100%" }}>
                    <Space>
                      <UserOutlined style={{ color: "#8c8c8c" }} />
                      <Text type="secondary">{visit.doctorName}</Text>
                    </Space>
                    <Text italic>{visit.summary}</Text>
                  </Space>
                </div>

                <Collapse
                  ghost
                  size="small"
                  items={[
                    {
                      key: "details",
                      label: (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          View Details
                        </Text>
                      ),
                      children: (
                        <div
                          style={{
                            background: "#fafafa",
                            padding: "16px",
                            borderRadius: 8,
                            border: "1px solid #f0f0f0",
                          }}
                        >
                          <Title level={5}>Clinical Notes</Title>
                          <Paragraph>{visit.notes}</Paragraph>

                          <Divider style={{ margin: "12px 0" }} />

                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "1fr 1fr",
                              gap: 16,
                            }}
                          >
                            <div>
                              <Text strong style={{ display: "block" }}>
                                Diagnosis
                              </Text>
                              <Paragraph>{visit.diagnosis}</Paragraph>
                            </div>
                            <div>
                              <Text strong style={{ display: "block" }}>
                                Observations
                              </Text>
                              <Paragraph>{visit.observations}</Paragraph>
                            </div>
                          </div>

                          {visit.prescriptions.length > 0 && (
                            <>
                              <Divider style={{ margin: "12px 0" }} />
                              <Text strong>Prescriptions</Text>
                              <ul
                                style={{
                                  paddingLeft: 20,
                                  marginTop: 8,
                                  marginBottom: 0,
                                }}
                              >
                                {visit.prescriptions.map((p) => (
                                  <li key={p.id}>
                                    <Text>{p.medicine}</Text> -{" "}
                                    <Text type="secondary">
                                      {p.dosage}, {p.frequency} for {p.duration}
                                    </Text>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </div>
                      ),
                    },
                  ]}
                />
              </Card>
            ),
          }))}
        />
      )}
    </div>
  );
}
