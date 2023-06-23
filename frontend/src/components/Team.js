import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import backendURLs from "../backendURLs";
import TeamMember from "./TeamMember";
import "../styles/team.css";
import Task from "./Task";
import { Card, List, Button, Typography } from "antd";
import PublishPost from "./PublishPost";
import Post from "./Post";

const { Title, Text } = Typography;
export default function Team() {
    const { id } = useParams();
    const [posts, setPosts] = useState([]);
    const [nextPage, setNextPage] = useState(2);
    const [data, setData] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [invite, setInvite] = useState("");
    const [challengeFormats, setChallengeFormats] = useState([]);
    const [challengeDurationFormats, setChallengeDurationFormats] = useState({});
    const [selectedTimeFormat, setSelectedTimeFormat] = useState("");
    useEffect(() => {
        setComponents();
    }, []);

    async function setComponents() {
        const responseTeam = await fetch(`${backendURLs.getTeam}/${id}/${localStorage.getItem('token')}`, {
            method: "GET",
        });
        const responseTasks = await fetch(`${backendURLs.teamTasks}/${id}/${localStorage.getItem('token')}`, {
            method: "GET"
        });
        const challenges = await fetch(`http://localhost:5000/challenges/${id}`, {
            method: "GET",
            headers: {
                'auth': localStorage.getItem('token')
            }
        });
        const posts = await fetch(`http://localhost:5000/post/${id}`, {
            method: "GET",
            headers: {
                'auth': localStorage.getItem('token'),
                'rows': 5,
                'page': 1
            }
        });
        const pageJson = await posts.json();
        const json = await challenges.json();
        let challengeFormats = [], challengeDurations = {};
        console.log("------------------");
        console.log(json);
        if (json.response.length !== 0) {
            challengeFormats = json.response[0].slice();
            for (const challengeDuration of json.response[1])
                challengeDurations[challengeDuration.DurationType] = [];
            for (const challengeDuration of json.response[2])
                challengeDurations[challengeDuration.DurationType].push(challengeDuration.TimeLength);
        }
        const jsonTeam = await responseTeam.json();
        const jsonTasks = await responseTasks.json();
        setChallengeFormats(challengeFormats);
        setChallengeDurationFormats(challengeDurations);
        if (pageJson.response !== undefined)
            setPosts(pageJson.response);
        for (const key in challengeDurations) {
            if (challengeDurations[key].length !== 0) {
                setSelectedTimeFormat(key);
                break;
            }
        }
        setData(jsonTeam.response);
        setTasks(jsonTasks.response);
    }
    async function handleInvite() {
        const response = await fetch(`${backendURLs.createInvite}/${id}`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                auth: localStorage.getItem('token')
            })
        });

        if (response.status !== 201) {
            alert("Could not create invite! Status: " + response.status);
            return;
        }

        const json = await response.json();

        if (json.response === undefined) {
            alert("No response property from the response.");
            return;
        }

        setInvite(json.response);
    }

    async function leaveTeam() {
        try {
            const response = await fetch(`http://localhost:5000/team/leave/${localStorage.getItem('userId')}`, {
                method: "DELETE",
                headers: {
                    'auth': localStorage.getItem('token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    teamId: id
                })
            });
            if (response.status !== 204) return;

            window.location.href = "/";
        } catch (err) {
            console.log(err);
        }
    }
    async function deleteTeam() {
        try {
            const response = await fetch(`http://localhost:5000/team/delete/${id}`, {
                method: "DELETE",
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
            if (response.status !== 204) return;

            window.location.href = "/";
        } catch (error) {
            console.log(error);
        }
    }
    if (data !== undefined && data.length > 0) {
        return (
            <div style={{ width: "100%", display: "flex", height: "auto", justifyContent: "center", backgroundColor: "#383A3F" }}>
                <div style={{ width: "65%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <Card style={{ backgroundColor: "#FF6B6B", width: "85%", height: "100%", border: "none", marginTop: "20px" }}>
                        <Card.Meta
                            avatar={<img src={data[0][0].LogoPath} alt="Team Image" style={{ maxWidth: "100px", height: "120px", borderRadius: "10px" }} />}
                            title={<Title level={2} style={{ color: "white", }}>{data[0][0].TeamName}</Title>}
                            description={
                                <>
                                    <Text style={{ color: "white", }}>{data[0][0].Description}</Text>
                                    <br />
                                    <Text style={{ color: "white", }}>
                                        {data[0][0].CurrentMembers}/{data[0][0].MaxMembers}
                                    </Text>
                                </>
                            }
                        />

                        {data[1][0].Count === 1 && (
                            <div style={{ marginTop: "5%", display: "flex", justifyContent: "space-evenly" }}>
                                <Button type="default" onClick={handleInvite}>
                                    CREATE INVITE
                                </Button>
                                <Button type="default" onClick={deleteTeam}>
                                    DELETE TEAM
                                </Button>
                                <Button type="default" onClick={leaveTeam}>
                                    LEAVE TEAM
                                </Button>
                            </div>
                        )}
                        {invite !== undefined && invite.length !== 0 && <h4 style={{ color: "white" }}>Your invite code: '{invite}'</h4>}
                    </Card>
                    <div className="team-task-container" style={{ marginTop: "40px" }}>
                        {tasks.map((item, index) => (
                            <Task setTasks={setTasks} props={item} index={index} />
                        ))}
                    </div>
                    {challengeFormats.length !== 0 &&
                        <PublishPost setPosts={setPosts} posterName={data[0][0].TeamName} id={id} setSelectedTimeFormat={setSelectedTimeFormat}
                            postTypes={data[2]} challengeDurationFormats={challengeDurationFormats}
                            selectedTimeFormat={selectedTimeFormat} challengeFormats={challengeFormats} />
                    }
                    <div style={{ marginTop: "20px" }}>
                        {posts.map((item, index) => {
                            return <Post fixed={true} post={item} index={index} setPosts={setPosts} />
                        })
                        }
                    </div>
                </div>
                <div style={{ width: "30%" }}>
                    <List
                        style={{ marginTop: "2%", backgroundColor: "whitesmoke" }}
                        header={<div>Members</div>}
                        bordered
                        dataSource={data[1]}
                        renderItem={(item, index) => (
                            <List.Item>
                                <TeamMember setTasks={setTasks} props={item} teamId={id} setData={setData} index={index} />
                            </List.Item>
                        )}
                    />
                </div >
            </div>

        );
    } else {
        return null; // Return null or loading spinner if data is still loading
    }
}