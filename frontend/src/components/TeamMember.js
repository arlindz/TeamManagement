import { useState } from "react";
import backendURLs from "../backendURLs";
import { Link } from "react-router-dom";
import { Card, Button, Input, Space } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export default function TeamMember({ props, setTasks, teamId, setData, index }) {
    const [description, setDescription] = useState("");

    async function handleAssignment() {
        try {
            const response = await fetch(backendURLs.createTask, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    auth: localStorage.getItem('token'),
                    taskDescription: description,
                    userId: props.UserId,
                    teamId: teamId
                })
            });
            if (response.status !== 201) return;
            const json = await response.json();
            setTasks((prev) => {
                return [...prev, {
                    Username: json.response.Username,
                    Description: json.response.Description, Status: json.response.Status === false ? 0 : 1, TaskId: json.response.TaskId
                }]
            });
        } catch (err) {
            console.log(err);
        }
    }
    async function kickMember() {
        try {
            const response = await fetch(`http://localhost:5000/team/leave/${props.UserId}`, {
                method: "DELETE",
                headers: {
                    'auth': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    teamId: teamId
                })
            });
            if (response.status !== 204) return;
            setData((prev) => {
                const aux = prev.slice();;
                aux[1] = [...aux[1].slice(0, index), ...aux[1].slice(index + 1, aux[1].length)];
                return aux;
            })
        } catch (error) {
            console.log(error);
        }
    }

    return (
        <Card
            style={{
                width: '100%',
                marginBottom: '10px',
                border: '1px solid #d9d9d9',
                borderRadius: '5px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link to={`/profile/${props.Username}`}>
                    <h4>{props.Username}</h4>
                </Link>
                {props.Count !== 0 &&
                    <div style={{ width: "auto" }}>
                        <DeleteOutlined style={{ fontSize: '20px' }} onClick={kickMember} />
                    </div>
                }
            </div>
            {
                props.Count !== 0 && (
                    <Space>
                        <TextArea
                            onChange={(e) => { setDescription(e.target.value) }}
                            style={{ width: '200px', maxHeight: "100px" }}
                            placeholder="Task description..."
                        />
                        <Button type="primary" onClick={handleAssignment}>
                            Assign Task
                        </Button>
                    </Space>
                )
            }
        </Card >
    );
}