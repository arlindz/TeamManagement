import { Form, Input, Button, Typography, Card, Upload } from "antd";
import { UserOutlined, LockOutlined, UploadOutlined } from "@ant-design/icons";
import backendURLs from "../backendURLs";
import "../styles/login.css";

const { Title } = Typography;

export default function Register({ setRegister }) {
    async function onFinish(values) {
        const form = new FormData();
        form.append('username', values.username);
        form.append('password', values.password);
        form.append('description', values.description);
        form.append('image', values.image[0].originFileObj);
        try {
            const response = await fetch(backendURLs.register, {
                method: "POST",
                body: form
            });

            if (response.status !== 201) {
                alert("Something went wrong. status: " + response.status);
                return;
            }
            alert("Successfully registered user.");
        } catch (err) {
            console.log(err);
        }
    };
    function beforeUpload(file) { return false }
    return (
        <div className="login-container">
            <Card className="register-card">
                <Form className="login-form" onFinish={onFinish}>
                    <Title level={3}>Register</Title>
                    <Form.Item
                        name="username"
                        rules={[
                            {
                                required: true,
                                message: "Please enter your username",
                            },
                        ]}
                    >
                        <Input prefix={<UserOutlined />} placeholder="Username" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[
                            {
                                required: true,
                                message: "Please enter your password",
                            },
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>
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
                    <Form.Item name="description">
                        <Input.TextArea
                            placeholder="Description"
                            style={{
                                maxHeight: "140px",
                                minHeight: "100px",
                            }}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" className="register-form-button">
                            Register
                        </Button>
                    </Form.Item>
                </Form>
                <Form.Item>
                    <Button type="primary" onClick={() => { setRegister(false) }} className="login-form-button">
                        Log in?
                    </Button>
                </Form.Item>
            </Card>
        </div>
    );
}
