import {Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis} from 'recharts';

const StockBarChart = ({data}) => {
    return (
        <div className="bg-white p-5 shadow-md rounded-lg">
            <h3 className="font-semibold mb-2">Stock Overview</h3>
            <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3"/>
                    <XAxis dataKey="name"/>
                    <YAxis/>
                    <Tooltip/>
                    <Bar dataKey="stock" fill="#82ca9d"/>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default StockBarChart;
