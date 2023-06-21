import backendURLs from "../backendURLs";
import { Card, Button, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

export default function Task({ props, index, setTasks }) {
    async function handleDelete() {
        const response = await fetch(`${backendURLs.deleteTask}/${props.TaskId}/${localStorage.getItem('token')}`, {
            method: 'DELETE',
        });
        if (response.status !== 204) {
            alert('Could not delete resource. Status: ' + response.status);
            return;
        }
        setTasks((prev) => {
            return [...prev.slice(0, index), ...prev.slice(index + 1)];
        });
    }

    return (
        <Card
            className="team-task"
            style={{ backgroundColor: 'lightgray' }}
            title={props.Username === undefined ? '' : `For ${props.Username}`}
            extra={
                props.Username && (
                    <Button type="primary" danger onClick={handleDelete}>
                        <DeleteOutlined />
                    </Button>
                )
            }
        >
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
                <div>
                    <Text>'{props.Description}'</Text></div>
                {props.Status !== undefined && (
                    <div style={{ width: "80px", marginTop: "5%", height: "auto", padding: "2px", borderRadius: "5px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "white" }}><Text type={props.Status === true ? 'success' : 'danger'} strong>
                        {props.Status === true ? 'Done' : 'Not done'}
                    </Text></div>
                )}
            </div>
        </Card >
    );
}