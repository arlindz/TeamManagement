import "../styles/navbar.css";
import { Link } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Badge, Input, Button } from "antd";
import { BellOutlined, PlusOutlined, LoginOutlined, TeamOutlined, HomeOutlined } from "@ant-design/icons";
import backendURLs from "../backendURLs";

export default function Navbar() {
    const [notifications, setNotifications] = useState(0);
    const inviteCode = useRef();

    async function getNotifications() {
        const response = await fetch(`${backendURLs.notificationCount}/${localStorage.getItem('token')}`, {
            method: "GET",
        });
        if (response.status !== 200) return;
        const json = await response.json();
        setNotifications(json.response[0].Count);
    }

    async function joinTeam() {
        alert(inviteCode.current.input.value);
        const response = await fetch(backendURLs.joinTeam, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                auth: localStorage.getItem('token'),
                invitationCode: inviteCode.current.input.value
            })
        });
        if (response.status != 201) alert("Didnt join the team! Status: " + response.status);
        else alert("Successfully joined team!");
    }
    useEffect(() => {
        getNotifications();
    }, []);

    return (
        <div className="navbar">
            <div className="items-container">
                <Link className="navbar-option" to={`/profile/${localStorage.getItem('username')}`}>
                    <p className="center">My profile</p>
                </Link>
                <Link className="navbar-option" to="/myTasks">
                    <p className="center">My tasks</p>
                </Link>
                <Link className="navbar-option bell" to="/notifications">
                    <Badge count={notifications}>
                        <BellOutlined className="center" />
                    </Badge>
                </Link>
                <Link className="navbar-option" to="/create">
                    <PlusOutlined className="center" />
                </Link>
                <Link className="navbar-option" to="/logIn">
                    <LoginOutlined className="center" />
                </Link>
                <Link className="navbar-option" to="/myteams">
                    <TeamOutlined className="center" />
                </Link>
                <Link className="navbar-option" to="/">
                    <HomeOutlined className="center" />
                </Link>
                <Input ref={inviteCode} className="navbar-input" placeholder="Invitation code" />
                <Button className="navbar-button" type="primary" onClick={joinTeam}>JOIN TEAM</Button>
            </div>
        </div>
    );
}