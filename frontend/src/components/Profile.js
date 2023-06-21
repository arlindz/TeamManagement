import { useEffect, useState } from "react"
import { useParams } from "react-router-dom";
import backendURLs from "../backendURLs";
import { Card, Avatar, Row, Col, Typography } from "antd";
import Post from "./Post";
import PublishPost from "./PublishPost";
const { Title, Text } = Typography;
export default function Profile() {
  const primaryColor = "#FF6B6B"; // Primary color
  const { id } = useParams();
  const [data, setData] = useState([]);
  const [postTypes, setPostTypes] = useState([]);
  const [posts, setPosts] = useState([]);
  async function setComponents() {
    const posts = await fetch(`http://localhost:5000/post/${localStorage.getItem('userId')}`, {
      method: "GET",
      headers: {
        'auth': localStorage.getItem('token'),
        'rows': 5,
        'page': 1
      }
    });
    const response = await fetch(`${backendURLs.getUser}/${id}/${localStorage.getItem('token')}`, {
      method: "GET"
    });
    const challenges = await fetch(`http://localhost:5000/challenges/postTypes/${localStorage.getItem('userId')}`, {
      method: "GET",
      headers: {
        'auth': localStorage.getItem('token')
      }
    });
    const postsJson = await posts.json();
    const challengeJson = await challenges.json();
    const json = await response.json();
    setPostTypes(challengeJson.response);
    setPosts(postsJson.response);
    setData(json.response);
  }

  async function followUser(m) {
    const response = await fetch(`${backendURLs.followUser}/${id}/${localStorage.getItem('token')}`, {
      method: m
    });
    if (response.status !== (m === "POST" ? 201 : 204)) return;
    alert("Successfully unfollowed user!");
  }
  console.log(posts);
  useEffect(() => {
    setComponents();
  }, []);
  if (data.length !== 0) {
    return (
      <div style={{ backgroundColor: "#383A3F", flex: "1" }}>
        <div style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-evenly" }}>
          <Card
            style={{
              width: 400,
              margin: "0",
              backgroundColor: primaryColor,
              padding: 16,
              borderRadius: 8,
              marginTop: "15px"
            }}
          >
            <Row justify="center" style={{ marginBottom: 16 }}>
              <Col>
                <Avatar
                  size={64}
                  src={data[1][0].LogoPath}
                  style={{ backgroundColor: "#fff" }}
                />
              </Col>
            </Row>
            <Row justify="center" style={{ marginBottom: 16 }}>
              <Col>
                <Title level={4} style={{ color: "#fff" }}>
                  @{data[1][0].Username}
                </Title>
              </Col>
            </Row>
            <Row justify="center" gutter={16} style={{ marginBottom: 16 }}>
              <Col span={12}>
                <Text strong style={{ color: "white" }}>
                  Followers
                </Text>
                <br />
                <Text style={{ color: "#fff" }}>{data[1][0].Followers}</Text>
              </Col>
              <Col span={12}>
                <Text strong style={{ color: "white" }}>
                  Following
                </Text>
                <br />
                <Text style={{ color: "#fff" }}>{data[1][0].Following}</Text>
              </Col>
            </Row>
            <Row justify="center">
              <Col>
                <Text style={{ color: "#fff" }}>{data[1][0].Description}</Text>
              </Col>
            </Row>
          </Card>

          <PublishPost setPosts={setPosts} posterName={data[1][0].Username} postTypes={postTypes} id={localStorage.getItem('userId')} />
        </div>
        <div style={{ display: "flex", justifyContent: "center" }}>
          <div style={{ borderBottom: "1px solid white", width: "60%", paddingLeft: "5%" }}>
            <h2 style={{ color: "white" }}>My posts</h2>
          </div>
        </div>
        <div style={{ width: "100%", height: "auto", display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center", marginTop: "1%", marginBottom: "5%" }}>
          {posts !== undefined && posts.map((item, index) => {
            return <Post fixed={false} post={item} index={index} setPosts={setPosts} postTypes={postTypes} />
          })}
        </div>
      </div>
    );
  }
}