import { useState, useEffect } from "react";
import backendURLs from "../backendURLs";
import { List, Typography, Card, Button } from "antd";
import { Link } from "react-router-dom";
import { CheckOutlined, CloseOutlined } from "@ant-design/icons";

const { Title } = Typography;

export default function MyTasks() {
    const [data, setData] = useState([]);

    async function fetchTasks() {
        const response = await fetch(`${backendURLs.getMyTasks}/${localStorage.getItem("token")}`, {
            method: "GET",
        });
        if (response.status !== 200) return;
        const json = await response.json();
        setData(json.response);
    }

    async function markTaskAs(mark, id, index) {
        const response = await fetch(`${backendURLs.setTask}/${id}/${localStorage.getItem("token")}`, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                status: mark === true ? 1 : 0
            })
        });
        if (response.status !== 200) return;
        setData((prev) => {
            const newData = [...prev];
            newData[index].Status = mark;
            return newData;
        });
    }
    useEffect(() => {
        fetchTasks();
    }, []);
    function removeTask(index) {
        setData((prev) => {
            let newData = prev.slice();
            newData = [...newData.slice(0, index), ...newData.slice(index + 1, newData.length)];
            return newData;
        })
    }
    return (
        <div style={{ background: "rgb(56, 58, 63)", minHeight: "100vh", padding: "24px" }}>
            <Card style={{ width: "600px", margin: "0 auto" }}>
                <Title level={3}>My Tasks</Title>
                <div style={{ height: "400px", overflowY: "auto" }}>
                    {data.length !== 0 ? (
                        data.map((item, index) => (
                            <Card
                                key={item.TaskId}
                                style={{
                                    background: item.Status === true ? "#d9f7be" : "#f2f2f2",
                                    marginBottom: "16px",
                                    padding: "16px",
                                    borderRadius: "4px",
                                }}
                            >
                                <Link to={`/team/${item.TeamId}`}>
                                    <h2>{item.TeamName}</h2>
                                </Link>
                                <h3>{item.Description}</h3>
                                {item.Status === false ? (
                                    <Button
                                        type="primary"
                                        icon={<CheckOutlined />}
                                        onClick={() => markTaskAs(true, item.TaskId, index)}
                                        style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
                                    >
                                        Mark as Done
                                    </Button>
                                ) : (
                                    <>
                                        <Button onClick={() => markTaskAs(false, item.TaskId, index)}>Mark as not done</Button>
                                        <Button
                                            type="primary"
                                            icon={<CloseOutlined />}
                                            onClick={() => removeTask(index)}
                                            style={{ backgroundColor: "red", borderColor: "red" }}
                                        >
                                            Delete
                                        </Button>
                                    </>
                                )}
                            </Card>
                        ))
                    ) : (
                        <Card
                            style={{
                                background: "#f2f2f2",
                                marginBottom: "16px",
                                padding: "16px",
                                borderRadius: "4px",
                            }}
                        >
                            <h2>You don't have any tasks for the moment!</h2>
                        </Card>
                    )}
                </div>
            </Card>
        </div>
    );
}