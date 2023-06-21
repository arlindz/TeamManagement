import { Form, Input, Button, Typography, Select, Upload, Tag, Card } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import "../styles/createTeam.css";
import backendURLs from "../backendURLs";
import { useState, useEffect, useRef } from "react";
const { Option } = Select;
const { Title } = Typography;

export default function CreateTeam() {
    const [form] = Form.useForm();
    const [data, setData] = useState({});
    const [orientationSelected, setOrientationSelected] = useState('Loading...');
    const [teamTypes, setTeamTypes] = useState({});
    const [teamType, setTeamType] = useState('Loading...');
    async function setComponents() {
        const orientationsResponse = await fetch(`${backendURLs.getOrientations}/${localStorage.getItem('token')}`, {
            method: "GET"
        });
        const teamTypesResponse = await fetch(`${backendURLs.getTeamTypes}/${localStorage.getItem('token')}`, {
            method: "GET"
        })
        if (orientationsResponse.status != 200 || teamTypesResponse.status != 200) return;
        const orientationsJson = await orientationsResponse.json();
        const teamTypesJson = await teamTypesResponse.json();
        const objToAssign = {};
        const orientations = orientationsJson.response, teamTypes = teamTypesJson.response;

        for (const orientation of orientations)
            objToAssign[orientation.Orientation] = [];

        for (const teamType of teamTypes)
            objToAssign[teamType.Orientation].push(teamType.TeamType);

        console.log(objToAssign);
        form.setFieldsValue({
            orientation: Object.keys(objToAssign)[0],
            teamType: objToAssign[Object.keys(objToAssign)[0]][0]
        });
        setData(objToAssign);
        setOrientationSelected(Object.keys(objToAssign)[0]);
        setTeamType(objToAssign[Object.keys(objToAssign)[0]][0]);
    }
    async function addTeam(values) {
        try {
            const form = new FormData();
            form.append('teamName', values.teamName);
            form.append('maxMembers', values.maxMembers);
            form.append('description', values.description);
            form.append('auth', localStorage.getItem('token'));
            form.append("image", values.image[0].originFileObj);
            form.append('teamTypes', Object.keys(teamTypes));
            const response = await fetch(backendURLs.registerTeam, {
                method: "POST",
                body: form
            })
            if (response.status === 201) alert("Team created successfully!");
        } catch (error) {
            console.log(error);
            alert(error);
        }
    }
    function beforeUpload() {
        return false;
    }
    function handleOrientationChange(value) {
        form.setFieldsValue({
            orientation: value,
            teamType: data[value][0]
        });
        setOrientationSelected(value);
    }
    function handleTeamTypeChange(value) {
        setTeamType(value);
    }
    function addTeamType() {
        setTeamTypes((prev) => {
            return { ...prev, [teamType]: null };
        })
    }
    function handleTagClose(key) {
        setTeamTypes((prev) => {
            const updated = { ...prev };
            delete updated[key];
            return updated;
        })
    }
    useEffect(() => {
        setComponents();
    }, [])
    return (
        <div className="create-team-container" style={{ height: "100%", backgroundColor: "#383A3F" }}>
            <Card title="Create a Team" style={{ width: "500px" }}>
                <Form form={form} onFinish={addTeam} className="create-team-form">
                    <Form.Item style={{ marginBottom: "0px" }}
                        name="teamName"
                        rules={[
                            { required: true, message: "Please enter the team name" },
                        ]}
                    >
                        <Input placeholder="Team Name" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: "0px" }}
                        name="maxMembers"
                        rules={[
                            {
                                required: true,
                                message: "Please enter the maximum number of members",
                            },
                        ]}
                    >
                        <Input type="number" placeholder="Maximum Members" />
                    </Form.Item>
                    <Form.Item style={{ marginBottom: "0px" }}
                        name="description"
                        rules={[
                            { required: true, message: "Please enter the team description" },
                        ]}
                    >
                        <Input.TextArea placeholder="Team Description" />
                    </Form.Item>
                    <div style={{ display: "flex", width: "100%", justifyContent: "space-evenly" }}>
                        <Form.Item style={{ width: "40%" }}
                            name="orientation"
                            rules={[
                                { required: true, message: "Please select an orientation" },
                            ]}
                        >
                            <Select placeholder="Select Orientation" onChange={handleOrientationChange}
                                value={orientationSelected}>
                                {Object.keys(data).map((item) => (
                                    <Option key={item} value={item}>
                                        {item}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                        <Form.Item style={{ width: "40%" }}
                            name="teamType"
                            rules={[
                                { required: true, message: "Please select a team type" },
                            ]}
                        >
                            <Select placeholder="Select Team Type"
                                value={teamType} onChange={handleTeamTypeChange}>
                                {data[orientationSelected]?.map((item) => (
                                    <Option key={item} value={item}>
                                        {item}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>
                    <Button type="dashed" onClick={addTeamType}>
                        Add team type
                    </Button>
                    <div style={{ display: "flex", flexWrap: "wrap", marginTop: "8px" }}>
                        {Object.keys(teamTypes).map((item) => (
                            <Tag key={item} closable onClose={() => handleTagClose(item)}>{item}</Tag>
                        ))}
                    </div>
                    <Form.Item
                        name="image"
                        rules={[{ required: true, message: "Please upload an image" }]}
                        valuePropName="fileList"
                        getValueFromEvent={(e) => e.fileList.slice(-1)} // Accept only the last uploaded file
                    >
                        <Upload
                            name="image"
                            beforeUpload={beforeUpload}
                            accept="image/*"
                            showUploadList={true}
                        >
                            <Button icon={<UploadOutlined />}>Upload Image</Button>
                        </Upload>
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            Create Team
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div >
    );
}
