import { useState } from "react";
import backendURLs from "../backendURLs";
import { useRef } from "react";
import { Input, Button, Checkbox, Space, Switch } from "antd";
import { SendOutlined } from "@ant-design/icons";

const { TextArea } = Input;

export default function MakePost() {
    const [priv, setPriv] = useState(false);
    const content = useRef();

    function reversePublicity() {
        setPriv((prev) => !prev);
    }
    async function publishPost() {
        console.log(content);
        const response = await fetch(
            `${backendURLs.publishPost}/${localStorage.getItem("token")}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    content: content.current.resizableTextArea.textArea.textContent,
                    public: priv ? 0 : 1,
                }),
            }
        );
        if (response.status != 201) {
            alert(response.status);
            return;
        }
        alert("Published post successfully!");
    }

    return (
        <div style={{ display: "flex", alignItems: "center" }}>
            <Input.TextArea
                ref={content}
                placeholder="Write a post..."
                style={{ flex: "1", marginRight: "8px" }}
            />
            <Space style={{ marginTop: "16px" }}>
                <Switch checkedChildren="Public" unCheckedChildren="Private" checked={!priv} onChange={reversePublicity} />
                <Button type="primary" onClick={publishPost}>PUBLISH</Button>
            </Space>
        </div>
    );
}