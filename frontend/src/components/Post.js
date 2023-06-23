import { useEffect, useState } from 'react';
import { Card, Typography, Row, Col, Form, Select, InputNumber, Input, Button } from 'antd';
import {
    MessageOutlined, ThunderboltOutlined, DeleteOutlined,
    LockOutlined, GlobalOutlined, EditOutlined, CloseOutlined,
    CheckOutlined, LikeOutlined, DislikeOutlined, DislikeFilled, LikeFilled
} from "@ant-design/icons";

const { Option } = Select;
const { Title, Text } = Typography;

const Post = ({ posterName, post, index, setPosts, postTypes, durationTypes, challengeFormats, fixed, userTeams }) => {
    const postTypeIcons = {
        Post: <MessageOutlined style={{ marginLeft: "5px" }} />,
        Challenge: <ThunderboltOutlined style={{ marginLeft: "5px" }} />
    }
    const isPublicIcons = {
        true: ["Public", <GlobalOutlined style={{ marginLeft: "5px" }} />],
        false: ["Private", <LockOutlined style={{ marginLeft: "5px" }} />]
    }
    const [form] = Form.useForm();
    const [editingMode, setEditingMode] = useState(false);
    const [postIsChallenge, setPostIsChallenge] = useState(post.PostType == "Challenges" ? true : false);
    const [selectedDurationType, setSelectedDurationType] = useState(post.DurationType === null ? durationTypes === undefined ? "" : Object.keys(durationTypes)[0] : post.DurationType);
    const [durationLength, setDurationLength] = useState(post.DurationLength === null ? durationTypes === undefined ? "" : durationTypes[selectedDurationType][0] : post.DurationLength);
    const [liked, setLiked] = useState(post.LikingStatus === null ? false : post.LikingStatus);
    const [disliked, setDisliked] = useState(post.LikingStatus === null ? false : !post.LikingStatus);
    const [teamsOfUser, setTeamsOfUser] = useState({});
    const [selectedTeam, setSelectedTeam] = useState("");
    useEffect(() => {
        try {
            const aux = Object.assign({}, userTeams);
            for (const key in aux) {
                console.log("Checking at " + key)
                console.log(aux[key]);
                console.log("against");
                console.log(post.PosterId + "," + post.Orientation);
                if (key == post.PosterId || aux[key].teamOrientation != post.Orientation) delete aux[key];
            }
            setTeamsOfUser(aux);
            setSelectedTeam(Object.keys(aux).length > 0 ? Object.keys(aux)[0] : "");
        } catch (error) {
            console.log(error);
        }
    }, []);
    async function showInterest() {
        try {
            const repsonse = await fetch(`http://localhost:5000/challenges/showInterest/${post.PostId}`, {
                method: "POST",
                headers: {
                    'auth': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    teamId: selectedTeam
                })
            });
            if (repsonse.status !== 201) return;
        } catch (error) {
            console.log(error);
        }
    }
    async function deletePost() {
        try {
            const response = await fetch(`http://localhost:5000/post/${post.PostId}`, {
                method: "DELETE",
                headers: {
                    'auth': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    posterId: post.PosterId
                })
            })
            if (response.status !== 204) return;
            setPosts((prev) => {
                return [...prev.slice(0, index), ...prev.slice(index + 1, prev.length)];
            })
        } catch (error) {
            console.log(error);
        }
    }
    async function likePost() {
        try {
            const response = await fetch(`http://localhost:5000/like/post/${post.PostId}`, {
                method: "POST",
                headers: {
                    'auth': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    like: true
                })
            });
            if (response.status !== 200) return;
            const json = await response.json();
            setLiked(json.response.length === 0 ? false : json.response[0].State);
            setDisliked(false);
            setPosts((prev) => {
                const aux = prev.slice();
                aux[index] = {
                    ...aux[index],
                    Likes: json.response.length === 0 ?
                        aux[index].LikingStatus === true ?
                            aux[index].Likes - 1 :
                            aux[index].Likes :
                        json.response[0].State === true ? aux[index].Likes + 1 : aux[index].Likes,
                    Dislikes: aux[index].LikingStatus === false ? aux[index].Dislikes - 1 : aux[index].Dislikes,
                    LikingStatus: json.response.length === 0 ? null : json.response[0].State,
                };
                return aux;
            })
        } catch (error) {
            console.log(error);
        }
    }
    async function dislikePost() {
        try {
            const response = await fetch(`http://localhost:5000/like/post/${post.PostId}`, {
                method: "POST",
                headers: {
                    'auth': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    like: false
                })
            });
            if (response.status !== 200) return;
            const json = await response.json();
            setLiked(false);
            setDisliked(json.response.length === 0 ? false : !json.response[0].State);
            setPosts((prev) => {
                const aux = prev.slice();
                aux[index] = {
                    ...aux[index],
                    Dislikes: json.response.length === 0 ?
                        aux[index].LikingStatus === false ?
                            aux[index].Dislikes - 1 :
                            aux[index].Dislikes :
                        json.response[0].State === false ? aux[index].Dislikes + 1 : aux[index].Dislikes,
                    Likes: aux[index].LikingStatus === true ? aux[index].Likes - 1 : aux[index].Likes,
                    LikingStatus: json.response.length === 0 ? null : json.response[0].State,
                };
                return aux;
            })
        } catch (error) {
            console.log(error);
        }
    }
    function formatDate(dateString) {
        const date = new Date(dateString);

        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();

        const formattedDate = `${year}-${addLeadingZero(month)}-${addLeadingZero(day)} ${addLeadingZero(hours)}:${addLeadingZero(minutes)}:${addLeadingZero(seconds)}`;

        return formattedDate;
    }
    function addLeadingZero(value) {
        return value.toString().padStart(2, '0');
    }
    const onFinish = async (values) => {
        try {
            console.log(values)
            const response = await fetch(`http://localhost:5000/post/${post.PosterId}`, {
                method: "PUT",
                headers: {
                    'auth': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: values.description,
                    public: values.visibility === "Public" ? true : false,
                    format: values.format,
                    durationType: values.durationType,
                    durationLength: values.durationLength,
                    postType: values.postType,
                    postId: post.PostId
                })
            })
            if (response.status !== 200) return;
            setPosts((prev) => {
                const aux = prev.slice();
                aux[index] = {
                    ...aux[index],
                    Content: values.description,
                    IsPublic: values.visibility === "Public" ? true : false,
                    ChallengeFormat: values.format,
                    DurationType: values.durationType,
                    DurationLength: values.durationLength,
                    PostType: values.postType + "s"
                };
                return aux;
            });
            setEditingMode(false);
        } catch (e) {
            console.log(e);
        }
    };
    return (
        <Card style={{
            width: fixed === true ? "600px" : "40%", margin: '20px', marginBottom: "80px", backgroundColor: "#ff6b6b"
        }}>
            <Form form={form} onFinish={onFinish}>
                <Row justify="space-between" align="middle" style={{ marginBottom: '10px' }}>
                    <Col>
                        <Title style={{ margin: "0", color: "white" }} level={4}>{post.TeamName !== null ? post.TeamName : post.Username}</Title>
                        <Text style={{ margin: "0", color: "white" }} type="secondary">{formatDate(post.PostedAt)}</Text>
                    </Col>
                    <Col>
                        <div style={{ padding: "10px", width: "auto", height: "auto", backgroundColor: "#FF5353", borderRadius: "3px" }}>
                            {editingMode === false ?
                                <Text style={{ margin: "0", color: "white" }} strong>{post.PostType.substring(0, post.PostType.length - 1)}{postTypeIcons[post.PostType.substring(0, post.PostType.length - 1)]}</Text> :
                                <Form.Item style={{ margin: "0", height: "auto" }} name="postType" initialValue={post.PostType.substring(0, post.PostType.length - 1)}>
                                    <Select style={{ width: "120px" }}
                                        onChange={(val) => {
                                            if (val === "Post") setPostIsChallenge(false);
                                            else setPostIsChallenge(true);
                                        }}>
                                        {postTypes.map((item) => {
                                            return <Option value={item.PostType.substring(0, item.PostType.length - 1)}>
                                                <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                    {item.PostType.substring(0, item.PostType.length - 1)} {postTypeIcons[item.PostType.substring(0, item.PostType.length - 1)]}
                                                </div>
                                            </Option>
                                        })}
                                    </Select>
                                </Form.Item>
                            }
                        </div>
                    </Col>
                    <Col>
                        <div style={{ padding: "10px", width: "auto", height: "auto", backgroundColor: "#FF5353", borderRadius: "3px" }}>
                            {editingMode === false ?
                                <Text style={{ margin: "0", color: "white" }} strong>{isPublicIcons[post.IsPublic][0]}{isPublicIcons[post.IsPublic][1]}</Text> :
                                <Form.Item style={{ margin: "0", height: "auto" }} name="visibility" initialValue={isPublicIcons[post.IsPublic][0]}>
                                    <Select defaultValue={isPublicIcons[post.IsPublic][0]} style={{ width: "100px" }}>
                                        <Option value="Public">
                                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                Public <GlobalOutlined style={{ marginLeft: "5px" }} />
                                            </div>
                                        </Option>
                                        <Option value="Private">
                                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                Private <LockOutlined style={{ marginLeft: "5px" }} />
                                            </div>
                                        </Option>
                                    </Select>
                                </Form.Item>
                            }
                        </div>
                    </Col>
                </Row>
                <div style={{ padding: "10px", width: "auto", height: "auto", backgroundColor: "#FF5353", borderRadius: "3px" }}>
                    {editingMode === false ?
                        <Text style={{ margin: "0", color: "white" }}>{post.Content}</Text> :
                        <Form.Item style={{ margin: "0" }} name="description" initialValue={post.Content}>
                            <Input.TextArea style={{ margin: "0", height: 'auto', maxHeight: "140px" }} placeholder={"Write your post/challenge here as " + posterName} />
                        </Form.Item>
                    }
                </div>
                {postIsChallenge === true && (
                    <>
                        <Row style={{ marginTop: "3%" }} gutter={[16, 16]}>
                            <Col span={12}>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <Text style={{ margin: "0", color: "white" }} strong>Game Format: </Text>
                                    <Text style={{ margin: "0", color: "white", display: "flex", alignItems: "center" }}>
                                        {editingMode === false ?
                                            post.ChallengeFormat :
                                            <Form.Item style={{ margin: "0", marginLeft: "5%" }} initialValue={post.ChallengeFormat === null ? challengeFormats[0].ChallengeFormat : post.ChallengeFormat} name="format">
                                                <Select>
                                                    {challengeFormats !== undefined && challengeFormats.map((item) => {
                                                        return <Option value={item.ChallengeFormat}>{item.ChallengeFormat}</Option>
                                                    })}
                                                </Select>
                                            </Form.Item>
                                        }
                                    </Text>
                                </div>
                            </Col>
                        </Row>
                        <Row style={{ marginTop: "3%" }}>
                            <Col span={24}>
                                <div style={{ display: "flex", alignItems: "center" }}>
                                    <Text style={{ margin: "0", color: "white" }} strong>The game will last: </Text>
                                    <Text style={{ margin: "0", color: "white" }}>
                                        {editingMode === false ?
                                            ` ${post.DurationType}(${post.DurationLength})` :
                                            <div style={{ display: "flex", alignItems: "center" }}>
                                                <Form.Item style={{ margin: "0", marginLeft: "3%" }} name="durationType" initialValue={selectedDurationType}>
                                                    <Select style={{ width: "115px " }} onChange={(val) => { setSelectedDurationType(val); setDurationLength(durationTypes[val].length === 0 ? 5 : durationTypes[val][0]) }}>
                                                        {Object.keys(durationTypes).map((item) => {
                                                            return <Option value={item}>{item}</Option>
                                                        })}
                                                    </Select>
                                                </Form.Item>
                                                <Form.Item style={{ margin: "0", marginLeft: "3%" }} name="durationLength" initialValue={durationLength}>
                                                    {durationTypes[selectedDurationType].length === 0 ? <InputNumber value={durationLength} />
                                                        : <Select defaultValue={durationLength} onChange={(val) => { setDurationLength(val); }}>
                                                            {durationTypes[selectedDurationType].map((item) => {
                                                                return <Option value={item}>{item}</Option>
                                                            })}
                                                        </Select>
                                                    }
                                                </Form.Item>
                                            </div>
                                        }
                                    </Text>
                                </div>
                            </Col>
                        </Row>
                    </>
                )
                }
                {post.CanModify === 1 && (
                    <Row justify="end" style={{ marginTop: "10px" }}>
                        <Col span={24} style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
                            <DeleteOutlined onClick={deletePost} style={{ color: "white", fontSize: "18px", cursor: "pointer", marginRight: "3%" }} />
                            {
                                editingMode === false ?
                                    <EditOutlined onClick={() => { setEditingMode(true) }} style={{ color: "white", cursor: "pointer", fontSize: "18px" }} /> :
                                    <div style={{ padding: "5px", display: "flex", width: "auto", justifyContent: "space-between", alignItems: "center", border: "1px solid white", borderRadius: "5px" }}>
                                        <Button style={{ backgroundColor: "rgba(0,0,0,0)", border: "none", width: "auto", height: "auto" }} htmlType='submit'><CheckOutlined style={{ color: "white", fontSize: "18px", cursor: "pointer", marginRight: "3%" }} /></Button>
                                        <Button style={{ backgroundColor: "rgba(0,0,0,0)", border: "none", width: "auto", height: "auto" }} onClick={() => { setEditingMode(false) }}  ><CloseOutlined style={{ color: "white", fontSize: "18px", cursor: "pointer", marginRight: "3%" }} /></Button>
                                    </div>
                            }
                        </Col>
                    </Row>)
                }
                <Row style={{ marginTop: "20px", height: "40px", display: "flex", justifyContent: "center", flexDirection: "column", borderTop: "1px solid white" }}>
                    <Col style={{ display: "flex", margin: "0", height: "25px" }} span={24}>
                        <div style={{ width: "10%", display: "flex", alignItems: "center" }}>
                            <h3 style={{ color: "white" }}>{post.Likes}</h3>
                            {liked === true ?
                                <LikeFilled onClick={likePost} style={{ color: "white", fontSize: "18px", marginLeft: "6px" }} /> :
                                <LikeOutlined onClick={likePost} style={{ color: "white", fontSize: "18px", marginLeft: "6px" }} />}
                        </div>
                        <div style={{ width: "10%", display: "flex", alignItems: "center" }}>
                            <h3 style={{ color: "white" }}>{post.Dislikes}</h3>
                            {disliked === true ?
                                <DislikeFilled onClick={dislikePost} style={{ color: "white", fontSize: "18px", marginLeft: "6px", marginTop: "4px" }} /> :
                                <DislikeOutlined onClick={dislikePost} style={{ color: "white", fontSize: "18px", marginLeft: "6px", marginTop: "4px" }} />}
                        </div>
                        <div style={{ width: "20%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <h3 style={{ color: "white" }}>Comments({post.Comments})</h3>
                        </div>
                    </Col>
                </Row>
                {post.PostType === "Challenges" &&
                    <Row style={{ marginTop: "3%" }}>
                        <Col span={40}>
                            {Object.keys(teamsOfUser).length > 0 && (
                                <div style={{ display: 'flex', alignItems: 'center' }}>
                                    <Button onClick={showInterest} style={{ backgroundColor: "#ff6b6b", color: "white" }} type="default">
                                        Show interest
                                    </Button>
                                    <span style={{ margin: '0 8px', fontSize: '12px' }}>as</span>
                                    <Select
                                        value={teamsOfUser[selectedTeam].teamName}
                                        style={{ width: 'auto', fontSize: '8px' }}
                                        onChange={(val) => setSelectedTeam(val)}
                                    >
                                        {Object.keys(teamsOfUser).map((teamId) => (
                                            <Option key={teamId} value={teamId}>
                                                {teamsOfUser[teamId].teamName}
                                            </Option>
                                        ))}
                                    </Select>
                                </div>
                            )}</Col>
                    </Row>
                }
            </Form >
        </Card >
    );
};

export default Post;