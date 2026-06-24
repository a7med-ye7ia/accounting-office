import React, { useState, useEffect } from 'react';

const ActivityHistory = ({ companyId }) => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('authToken'); 
                const url = companyId
                    ? `http://localhost:8080/api/activity-logs/company/${companyId}`
                    : 'http://localhost:8080/api/activity-logs';
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': token ? `Bearer ${token}` : ''
                    }
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch activity logs');
                }

                const data = await response.json();
                setLogs(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
    }, [companyId]);
    // Helper to format the date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('ar-EG', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper to safely parse metadata JSON
    const parseMetadata = (metadataString) => {
        if (!metadataString) return null;
        try {
            return JSON.parse(metadataString);
        } catch (e) {
            return null;
        }
    };

    if (loading) return <div>جاري تحميل النشاطات...</div>;
    if (error) return <div style={{ color: 'red' }}>خطأ: {error}</div>;
    if (logs.length === 0) return <div>لا توجد نشاطات مسجلة.</div>;

    return (
        <div className="activity-timeline" style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
            <h3>سجل النشاطات (Activity History)</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '20px' }}>
                {logs.map((log) => {
                    const metadata = parseMetadata(log.metadata);

                    return (
                        <div key={log.id} style={{ padding: '15px', backgroundColor: '#f9f9f9', borderLeft: '4px solid #007bff' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <strong>{log.summary}</strong>
                                <span style={{ fontSize: '0.85em', color: '#666' }}>{formatDate(log.createdAt)}</span>
                            </div>
                            
                            <div style={{ fontSize: '0.9em', color: '#444' }}>
                                <span>Action: <strong>{log.action}</strong> | </span>
                                <span>Entity: <strong>{log.entityType}</strong> | </span>
                                <span>User ID: <strong>{log.userId}</strong></span>
                            </div>

                            {/* Display Metadata if it exists */}
                            {metadata && (
                                <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#eef', borderRadius: '4px', fontSize: '0.85em' }}>
                                    <strong>Details:</strong>
                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                        {JSON.stringify(metadata, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ActivityHistory;