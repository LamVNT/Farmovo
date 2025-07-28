import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts';
import {FormControl, InputLabel, MenuItem, Select} from "@mui/material";

const RevenueLineChart = ({data, timeFilter, setTimeFilter}) => {
    return (
        <div className="bg-white p-5 shadow-md rounded-lg">
            <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Revenue Trend</h3>
                <FormControl size="small">
                    <InputLabel id="time-select-label">Time</InputLabel>
                    <Select
                        labelId="time-select-label"
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value)}
                        label="Time"
                        style={{width: 120}}
                    >
                        <MenuItem value="weekly">Weekly</MenuItem>
                        <MenuItem value="monthly">Monthly</MenuItem>
                        <MenuItem value="annually">Annually</MenuItem>
                    </Select>
                </FormControl>
            </div>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="date"/>
                    <YAxis/>
                    <Tooltip/>
                    <Legend/>
                    <Line type="monotone" dataKey="revenue" stroke="#8884d8"/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default RevenueLineChart;
