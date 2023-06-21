import { useEffect, useState } from "react";
import { Card, Avatar, Progress } from "antd";
import { Link } from "react-router-dom";
import backendURLs from "../backendURLs";

const { Meta } = Card;

export default function MyTeams() {
    const [data, setData] = useState([]);

    async function fetchData() {
        const response = await fetch(backendURLs.getTeams, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                auth: localStorage.getItem("token"),
            }),
        });
        if (response.status !== 200) {
            alert("Couldnt fetch data....");
            return;
        }
        const json = await response.json();
        setData(json.response);
    }

    useEffect(() => {
        fetchData();
    }, []);

    return (
        <div style={{ display: "flex", flexWrap: "wrap", backgroundColor: "rgb(56, 58, 63)", flex: "1" }}>
            {data.map((item) => (
                <Link
                    to={`/team/${item.TeamId}`}
                    key={item.TeamId}
                    style={{ width: "300px", margin: "10px", textDecoration: "none" }}
                >
                    <Card
                        hoverable
                        style={{ width: "100%", backgroundColor: "aqua" }}
                    >
                        <Meta
                            avatar={<Avatar src={item.LogoPath} />}
                            title={item.TeamName}
                            description={item.Description}
                        />
                        <div style={{ marginTop: "10px" }}>
                            <Progress percent={Math.round((item.CurrentMembers / item.MaxMembers) * 100)} />
                        </div>
                        <div style={{ marginTop: "10px" }}>
                            <p>
                                Members: {item.CurrentMembers}/{item.MaxMembers}
                            </p>
                            <p>{item.TaskCount} tasks due</p>
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
}