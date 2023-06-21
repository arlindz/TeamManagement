
import PublishPost from "./PublishPost";
import Post from "./Post";
import { useState, useEffect } from "react";
import { Input, Button, Select } from 'antd';
const { Option } = Select;
const { Search } = Input;
export default function MainPage() {
    const [postTypes, setPostTypes] = useState([]);
    const [orientations, setOrientations] = useState({});
    const [posts, setPosts] = useState([]);
    const [selectedOrientation, setSelectedOrientation] = useState("");
    const [searchString, setSearchString] = useState("");
    const [selectedPostType, setSelectedPostType] = useState(orientations[selectedOrientation] === undefined ? "" : orientations[selectedOrientation][0]);
    async function search() {
        try {
            const posts = await fetch(`http://localhost:5000/post`, {
                method: "GET",
                headers: {
                    'auth': localStorage.getItem('token'),
                    'rows': 6,
                    'page': 1,
                    'search': searchString,
                    'postType': selectedPostType,
                    'by': selectedOrientation
                }
            })
            const json = await posts.json();
            setPosts(json.response);
        } catch (e) {
            console.log(e);
        }
    }
    async function setComponents() {
        try {
            const challenges = await fetch(`http://localhost:5000/challenges/postTypes/${localStorage.getItem('userId')}`, {
                method: "GET",
                headers: {
                    'auth': localStorage.getItem('token')
                }
            });
            const posts = await fetch(`http://localhost:5000/post`, {
                method: "GET",
                headers: {
                    'auth': localStorage.getItem('token'),
                    'rows': 6,
                    'page': 1,
                    'search': '',
                    'postType': 'Posts',
                    'by': 'All'
                }
            })
            const orientations = await fetch(`http://localhost:5000/challenges/orientations`, {
                method: "GET",
                headers: {
                    'auth': localStorage.getItem('token'),
                }
            });
            const challengeJson = await challenges.json();
            const orientationsJson = await orientations.json();
            const postsJson = await posts.json();
            const obj = {};
            for (const orientation of orientationsJson.response)
                if (orientation.Orientation in obj) obj[orientation.Orientation].push(orientation.PostType);
                else obj[orientation.Orientation] = [orientation.PostType, 'All'];
            obj['All'] = ['Posts', 'Challenges', 'All'];
            setPosts(postsJson.response);
            setPostTypes(challengeJson.response);
            setOrientations(obj);
            setSelectedOrientation(Object.keys(obj)[0]);
            setSelectedPostType(obj[Object.keys(obj)[0]][0]);
        } catch (error) {
            console.log(error);
        }
    }
    useEffect(() => {
        setComponents();
    }, [])
    return (
        <div style={{ width: "100%", flex: "1", backgroundColor: "#383A3F" }}>
            <div style={{ width: "60%", height: "120px", display: "flex", alignItems: "center", justifyContent: "space-evenly" }}>
                <Search
                    style={{ width: "400px", height: "80px", marginLeft: "20px", display: "flex", alignItems: "center" }}
                    placeholder="Search..."
                    enterButton={<Button onClick={search} type="primary">Search</Button>}
                    onChange={(e) => { setSearchString(e.target.value); }}
                    size="large"
                />
                <h2 style={{ color: "white" }}>I want to see</h2>
                <Select style={{ width: "auto" }} value={selectedPostType} onChange={(val) => { setSelectedPostType(val) }}>
                    {orientations[selectedOrientation] !== undefined && orientations[selectedOrientation].map((item, index) => {
                        return <Option value={item}>{item}</Option>
                    })}
                </Select>
                <h2 style={{ color: "white" }}> from </h2>
                <Select style={{ width: "100px" }} value={selectedOrientation} onChange={(val) => { setSelectedOrientation(val) }}>
                    {Object.keys(orientations).map((item, index) => {
                        return <Option value={item}>{item}</Option>
                    })}
                </Select>
            </div >
            <PublishPost setPosts={setPosts} posterName={localStorage.getItem('username')} id={localStorage.getItem('userId')} postTypes={postTypes} />
            <div style={{ width: "100%", height: "auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
                {posts !== undefined && posts.map((item, index) => {
                    return <Post fixed={false} post={item} index={index} setPosts={setPosts} postTypes={postTypes} posterName={item.Username === null ? item.TeamName : item.Username} />
                })}
                <Button type="default" style={{ marginBottom: "2%" }}>
                    See More
                </Button>
            </div>
        </div >
    );
}