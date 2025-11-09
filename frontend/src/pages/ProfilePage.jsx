// src/pages/ProfilePage.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import * as profileService from '../services/profileService.js';
import { getStudentCourses } from '../services/courseService.js';

const ProfilePage = () => {
    const { currentUser, student } = useAuth();
    const [editingDisplayName, setEditingDisplayName] = useState(false);
    const [newDisplayName, setNewDisplayName] = useState(student?.user?.displayName || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const formatDate = (value) => {
        if (!value) return 'Chưa cập nhật';
        const date = new Date(value);
        if (isNaN(date.getTime())) return 'Chưa cập nhật';
        return date.toLocaleDateString('en-GB'); // dd/mm/yyyy
    };

    const handleSaveDisplayName = async () => {
        if (!newDisplayName.trim()) {
            setError('Display name cannot be empty');
            return;
        }

        if (newDisplayName === student?.user?.displayName) {
            setError('Display name is the same as current');
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = await currentUser.getIdToken();
            await profileService.updateProfile(
                    token,
                    { displayName: newDisplayName.trim() }
            );

            setSuccess('✅ Display name updated successfully!');
            setEditingDisplayName(false);
            // Reload to reflect changes
            await currentUser.reload();
            window.location.reload();
        } catch (err) {
            console.error('❌ Error updating display name:', err);
            setError(err.message || 'Failed to update display name');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setNewDisplayName(student?.user?.displayName || '');
        setEditingDisplayName(false);
        setError('');
        setSuccess('');
    };

    return (
        <div className="container">
            <h1>👤 Thông Tin Cá Nhân</h1>
            {currentUser ? (
                <div className="card">
                    {error && (
                        <div style={{
                            backgroundColor: '#fee2e2',
                            border: '1px solid #fecaca',
                            color: '#991b1b',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            fontSize: '0.95rem',
                            fontWeight: '500'
                        }}>
                            {error}
                        </div>
                    )}

                    {success && (
                        <div style={{
                            backgroundColor: '#dcfce7',
                            border: '1px solid #86efac',
                            color: '#166534',
                            padding: '0.75rem',
                            borderRadius: '6px',
                            marginBottom: '1rem',
                            fontSize: '0.95rem',
                            fontWeight: '500'
                        }}>
                            {success}
                        </div>
                    )}
                        <div style={{ marginBottom: '1.5rem' }}>
                        <div style={{ 
                            width: '100px', 
                            height: '100px', 
                            borderRadius: '50%', 
                            backgroundColor: 'var(--primary-color)', 
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '3rem',
                            fontWeight: '700',
                            margin: '0 auto 1rem'
                        }}>
                            {student?.user?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
                        </div>
                    </div>                    <div style={{ display: 'grid', gap: '1rem' }}>
                        <div>
                            <strong style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Email:</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', color: 'var(--text-dark)' }}>{currentUser.email}</p>
                        </div>
                        
                        <div>
                            <strong style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>User ID:</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem', color: 'var(--text-dark)', fontFamily: 'monospace' }}>{currentUser.uid}</p>
                        </div>
                        
                        <div>
                            <strong style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Trạng thái xác thực:</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem' }}>
                                {currentUser.emailVerified ? '✅ Đã xác thực' : '❌ Chưa xác thực'}
                            </p>
                        </div>
                        
                        <div>
                            <strong style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Tên hiển thị:</strong>
                            {editingDisplayName ? (
                                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        value={newDisplayName}
                                        onChange={(e) => setNewDisplayName(e.target.value)}
                                        placeholder="Enter new display name"
                                        style={{
                                            flex: 1,
                                            padding: '0.5rem',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            fontSize: '1rem',
                                            fontFamily: 'inherit'
                                        }}
                                        disabled={loading}
                                    />
                                    <button
                                        onClick={handleSaveDisplayName}
                                        disabled={loading}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '6px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontWeight: '600',
                                            opacity: loading ? 0.6 : 1
                                        }}
                                    >
                                        {loading ? '⏳' : '✅'}
                                    </button>
                                    <button
                                        onClick={handleCancel}
                                        disabled={loading}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            backgroundColor: '#f3f4f6',
                                            color: 'var(--text-dark)',
                                            border: '1px solid var(--border-color)',
                                            borderRadius: '6px',
                                            cursor: loading ? 'not-allowed' : 'pointer',
                                            fontWeight: '600',
                                            opacity: loading ? 0.6 : 1
                                        }}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
                                    <p style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                                        {student?.user?.displayName || 'Not set'}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setEditingDisplayName(true);
                                            setNewDisplayName(student?.user?.displayeName || '');
                                            setError('');
                                            setSuccess('');
                                        }}
                                        style={{
                                            padding: '0.35rem 0.75rem',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: '600',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.target.style.opacity = '0.8'}
                                        onMouseLeave={(e) => e.target.style.opacity = '1'}
                                    >
                                        ✏️ Edit
                                    </button>
                                </div>
                            )}
                        </div>

                         <div>
                            <strong style={{ color: 'var(--text-light)', fontSize: '0.9rem' }}>Ngày tạo:</strong>
                            <p style={{ margin: '0.25rem 0 0', fontSize: '1.1rem', color: 'var(--text-dark)' }}>
                                {formatDate(student?.createdAt)}
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="card text-center">
                    <p>⏳ Đang tải thông tin...</p>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
