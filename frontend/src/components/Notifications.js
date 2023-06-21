import { useState, useEffect } from "react";
import backendURLs from "../backendURLs";
import { Button, List, Typography, Card } from "antd";

const { Title } = Typography;

export default function Notifications() {
    const [data, setData] = useState([]);

    async function fetchNotifications() {
        try {
            const response = await fetch(`${backendURLs.notifications}/${localStorage.getItem('token')}`, {
                method: "GET"
            });
            const json = await response.json();

            if (response.status !== 200) {
                alert("Could not get notifications!");
                return;
            }

            setData(json.response);
        } catch (error) {
            console.log(error);
        }
    }

    async function markAsSeen(id, index) {
        try {
            const response = await fetch(`${backendURLs.updateNotifications}/${id}/${localStorage.getItem('token')}`, {
                method: "PUT",
            });

            if (response.status !== 200) {
                return;
            }

            setData((prevData) => {
                const newData = [...prevData];
                newData[index].Seen = true;
                return newData;
            });
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <div style={{ background: "rgb(56,58,63)", minHeight: "100vh", padding: "24px" }}>
            <Card style={{ width: "600px", margin: "0 auto" }}>
                <div style={{ height: "400px", overflowY: "auto" }}>
                    <Title level={3}>Notifications</Title>
                    <Button onClick={fetchNotifications} style={{ marginBottom: "16px" }}>
                        Refresh
                    </Button>
                    <List
                        itemLayout="vertical"
                        size="large"
                        dataSource={data}
                        renderItem={(item, index) => (
                            <List.Item
                                extra={!item.Seen && (
                                    <Button onClick={() => markAsSeen(item.NotificationId, index)} disabled={item.Seen}>
                                        Mark as Seen
                                    </Button>
                                )}
                                style={{
                                    background: item.Seen ? "white" : "#fff1f0",
                                    border: item.Seen ? "1px solid #f0f0f0" : "1px solid #ff7875",
                                    borderRadius: "4px",
                                }}
                            >
                                <List.Item.Meta
                                    title={<span style={{ color: item.Seen ? "black" : "#ff4d4f" }}>{item.Description}</span>}
                                    description={new Date(item.ReceivedAt).toLocaleString()}
                                />
                            </List.Item>
                        )}
                    />
                </div>
            </Card>
        </div>
    );
}