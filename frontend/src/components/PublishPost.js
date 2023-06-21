import { Form, Input, Select, InputNumber, Button } from "antd";
import { LockOutlined, GlobalOutlined, MessageOutlined, ThunderboltOutlined } from "@ant-design/icons";
import { useState } from "react";
const { Option } = Select;
export default function PublishPost({ setPosts, posterName, id, postTypes, challengeDurationFormats, challengeFormats, setSelectedTimeFormat, selectedTimeFormat }) {
    const [form] = Form.useForm();
    const [postIsChallenge, setPostIsChallenge] = useState(false);

    const onFinish = async (values) => {
        try {
            console.log(values);
            const response = await fetch(`http://localhost:5000/post/${id}`, {
                method: "POST",
                headers: {
                    'auth': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: values.description,
                    public: values.visibility === "public" ? true : false,
                    format: values.challengeFormat,
                    durationType: values.timeFormat,
                    durationLength: values.durationFormat,
                    postType: values.type,
                })
            });
            if (response.status !== 201) return;
            const json = await response.json();
            console.log(json.response);
            setPosts((prev) => {
                const aux = prev.slice();
                aux.unshift(json.response[0]);
                return aux;
            });
        } catch (e) {
            console.log(e);
        }
    };
    const primaryColor = "#FF6B6B";

    const postTypeIcons = {
        Posts: <MessageOutlined style={{ marginLeft: "5px" }} />,
        Challenges: <ThunderboltOutlined style={{ marginLeft: "5px" }} />
    }
    const hasChallengeProps = challengeDurationFormats && challengeFormats && setSelectedTimeFormat && selectedTimeFormat;
    return (
        <Form form={form} onFinish={onFinish} style={{ width: "500px", marginTop: "30px", padding: "20px 20px 0px 20px", borderRadius: "5px", border: "1px solid white", backgroundColor: primaryColor }}>
            <Form.Item initialValue="" name="description">
                <Input.TextArea style={{ height: '140px', minHeight: "100px", maxHeight: "140px" }} placeholder={"Write your post/challenge here as " + posterName} />
            </Form.Item>
            <div style={{ display: "flex", width: "100%", justifyContent: "space-evenly" }}>
                <Form.Item name="visibility" initialValue="public" style={{ width: "auto" }}>
                    <Select>
                        <Option value="public">
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                Public <GlobalOutlined style={{ marginLeft: "5px" }} />
                            </div>
                        </Option>
                        <Option value="private">
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                Private <LockOutlined style={{ marginLeft: "5px" }} />
                            </div>
                        </Option>
                    </Select>
                </Form.Item>
                <Form.Item name="type" initialValue="Post" style={{ width: "28%" }}>
                    <Select onChange={(e) => {
                        if (e === "Post") setPostIsChallenge(false);
                        else setPostIsChallenge(true);
                    }}>
                        {postTypes.map((item) => {
                            return <Option value={item.PostType.substring(0, item.PostType.length - 1)}>
                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                    {item.PostType.substring(0, item.PostType.length - 1)} {postTypeIcons[item.PostType]}
                                </div>
                            </Option>
                        })}
                    </Select>
                </Form.Item>
                <Form.Item>
                    <Button type="default" htmlType="submit">
                        Post
                    </Button>
                </Form.Item>
            </div>
            {(postIsChallenge === true && hasChallengeProps) && (
                <div>
                    <div style={{ height: "60px", width: "auto", display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
                        <h4 style={{ color: "white", margin: "0" }}>Challenge format</h4>
                        <Form.Item initialValue={challengeFormats[0].ChallengeFormat} name="challengeFormat" style={{ margin: "0", marginLeft: "3%" }}>
                            <Select defaultValue={challengeFormats[0].ChallengeFormat} style={{ width: "auto" }}>
                                {challengeFormats !== undefined && challengeFormats.map((item) => (
                                    <Option key={item.ChallengeFormat} value={item.ChallengeFormat}>
                                        {item.ChallengeFormat}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </div>
                    <div style={{ height: "60px", width: "auto", display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
                        <h4 style={{ color: "white", margin: "0" }}>Game duration</h4>
                        <Form.Item initialValue={selectedTimeFormat} style={{ margin: "0", marginLeft: "3%" }} name="timeFormat">
                            <Select style={{ width: "130px" }} defaultValue={selectedTimeFormat} onChange={(value) => { setSelectedTimeFormat(value) }} >
                                {challengeDurationFormats !== undefined && Object.keys(challengeDurationFormats).map((item) => (
                                    <Option key={item} value={item}>
                                        {item}
                                    </Option>
                                ))}
                            </Select>
                        </Form.Item >
                        <h4 style={{ color: "white", margin: "0", marginLeft: "3%" }}>with</h4>
                        <Form.Item initialValue={challengeDurationFormats[selectedTimeFormat][0]} name="durationFormat" style={{ margin: "0", marginLeft: "3%" }}>
                            {challengeDurationFormats[selectedTimeFormat]?.length !== 0 ?
                                <Select defaultValue={challengeDurationFormats[selectedTimeFormat][0]}>
                                    {challengeDurationFormats !== undefined && challengeDurationFormats[selectedTimeFormat]?.map((item) => (
                                        <Option key={item} value={item}>
                                            {item}
                                        </Option>
                                    ))}
                                </Select> : <InputNumber defaultValue={5} />}
                        </Form.Item>
                    </div>
                </div>
            )
            }
        </Form >
    );
}