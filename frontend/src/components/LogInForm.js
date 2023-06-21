import { Form, Input, Button, Typography, Card } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import backendURLs from "../backendURLs";
import "../styles/login.css";

const { Title } = Typography;

export default function LogInForm({ setRegister }) {
  async function onFinish(values) {
    try {
      const response = await fetch(backendURLs.logIn, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: values.username,
          password: values.password
        })
      });

      if (response.status !== 200) {
        alert("Something went wrong. status: " + response.status);
        return;
      }
      const json = await response.json();
      if (json.response === undefined) {
        console.log("Invalid input");
        return;
      }
      console.log(json.response.token)
      localStorage.setItem('token', json.response.token);
      localStorage.setItem('username', json.response.username);
      localStorage.setItem('userId', json.response.userId);
      window.location.replace("/profile/" + json.response.username);
    } catch (err) {
      console.log(err);
    }
  };
  return (
    <div className="login-container">
      <Card className="login-card">
        <Form className="login-form" onFinish={onFinish}>
          <Title level={3}>Log In</Title>
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
          <Form.Item>
            <Button type="primary" htmlType="submit" className="login-form-button">
              Log In
            </Button>
          </Form.Item>
        </Form>
        <Form.Item>
          <Button type="primary" onClick={() => { setRegister(true) }} className="login-form-button">
            Register?
          </Button>
        </Form.Item>
      </Card>
    </div>
  );
}
