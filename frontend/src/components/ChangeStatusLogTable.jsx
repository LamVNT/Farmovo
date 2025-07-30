import React, { useState, useEffect } from 'react';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow, 
    Paper, 
    Button,
    Chip,
    IconButton,
    Tooltip
} from '@mui/material';
import { 
    Visibility as VisibilityIcon,
    ShoppingCart as SaleIcon,
    Inventory as ImportIcon,
    Assessment as StocktakeIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const ChangeStatusLogTable = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        fetchChangeStatusLogs();
    }, []);

    const fetchChangeStatusLogs = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/change-statuslog/list-all', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            });
            const data = await response.json();
            setLogs(data.content || []);
        } catch (error) {
            console.error('Error fetching change status logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleNavigateToSource = (log) => {
        if (log.sourceUrl) {
            navigate(log.sourceUrl);
        }
    };

    const getSourceIcon = (sourceType) => {
        switch (sourceType) {
            case 'SALE_TRANSACTION':
                return <SaleIcon fontSize="small" />;
            case 'IMPORT_TRANSACTION':
                return <ImportIcon fontSize="small" />;
            case 'STOCKTAKE':
                return <StocktakeIcon fontSize="small" />;
            default:
                return <VisibilityIcon fontSize="small" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETE':
            case 'COMPLETED':
                return 'success';
            case 'CANCEL':
            case 'CANCELLED':
                return 'error';
            case 'DRAFT':
                return 'default';
            case 'WAITING_FOR_APPROVE':
                return 'warning';
            default:
                return 'default';
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('vi-VN');
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>ID</TableCell>
                        <TableCell>Source</TableCell>
                        <TableCell>Previous Status</TableCell>
                        <TableCell>Next Status</TableCell>
                        <TableCell>Description</TableCell>
                        <TableCell>Created At</TableCell>
                        <TableCell>Actions</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell>{log.id}</TableCell>
                            <TableCell>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {getSourceIcon(log.sourceType)}
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>
                                            {log.sourceName}
                                        </div>
                                        <div style={{ fontSize: '0.8em', color: '#666' }}>
                                            {log.sourceType}
                                        </div>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Chip 
                                    label={log.previousStatus} 
                                    color={getStatusColor(log.previousStatus)}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell>
                                <Chip 
                                    label={log.nextStatus} 
                                    color={getStatusColor(log.nextStatus)}
                                    size="small"
                                />
                            </TableCell>
                            <TableCell>{log.description}</TableCell>
                            <TableCell>{formatDate(log.createdAt)}</TableCell>
                            <TableCell>
                                <Tooltip title="View Source">
                                    <IconButton
                                        onClick={() => handleNavigateToSource(log)}
                                        disabled={!log.sourceUrl}
                                        color="primary"
                                        size="small"
                                    >
                                        <VisibilityIcon />
                                    </IconButton>
                                </Tooltip>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default ChangeStatusLogTable; 