// src/components/GraphVisualization.jsx
import React, { useEffect, useRef, useState } from 'react';
import './GraphVisualization.css';

const GraphVisualization = ({ courses = [], enrolledCourses = [], graphType = 'profile-based' }) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [hoveredNode, setHoveredNode] = useState(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [nodes, setNodes] = useState([]);

    useEffect(() => {
        if (!canvasRef.current || !courses || courses.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Set canvas size
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        // Define safe zones (avoid title and legend)
        const topMargin = 70; // Space for title
        const bottomMargin = 160; // Space for legend
        const usableHeight = canvas.height - topMargin - bottomMargin;

        // User node (center) - Larger and more prominent
        const userNode = {
            x: canvas.width * 0.5,
            y: topMargin + usableHeight * 0.5,
            radius: 50,
            label: 'Bạn',
            fullLabel: 'Bạn (Học viên)',
            color: '#6366f1',
            secondaryColor: '#818cf8',
            type: 'user',
            id: 'user',
            icon: '👤'
        };

        // Calculate optimal positions for nodes - Recommended courses (upper half)
        const recommendedCount = Math.min(courses.length, 5);
        const recommendedNodes = courses.slice(0, recommendedCount).map((c, i) => {
            // Spread nodes horizontally in upper area with maximum spacing
            const totalWidth = canvas.width * 0.9;
            const startX = (canvas.width - totalWidth) / 2;
            const spacing = totalWidth / (recommendedCount + 1);
            const x = startX + spacing * (i + 1);
            const y = topMargin + usableHeight * 0.1;
            
            return {
                x: x,
                y: y,
                radius: 35,
                label: c.course_code || 'Môn',
                fullLabel: c.course_name,
                courseCode: c.course_code,
                courseName: c.course_name,
                color: '#10b981',
                secondaryColor: '#34d399',
                type: 'recommended',
                id: c.course_id,
                rank: c.rank,
                icon: '📚'
            };
        });

        // Calculate optimal positions for nodes - Enrolled courses (lower half)
        const enrolledCount = Math.min(enrolledCourses.length, 3);
        const enrolledNodes = enrolledCourses.slice(0, enrolledCount).map((c, i) => {
            // Spread nodes horizontally in lower area with maximum spacing
            const totalWidth = canvas.width * 0.75;
            const startX = (canvas.width - totalWidth) / 2;
            const spacing = totalWidth / (enrolledCount + 1);
            const x = startX + spacing * (i + 1);
            const y = topMargin + usableHeight * 0.9;
            
            return {
                x: x,
                y: y,
                radius: 32,
                label: c.course_code || 'Môn',
                fullLabel: c.course_name,
                courseCode: c.course_code,
                courseName: c.course_name,
                color: '#f59e0b',
                secondaryColor: '#fbbf24',
                type: 'enrolled',
                id: c.course_id,
                icon: '✓'
            };
        });

        const allNodes = [userNode, ...recommendedNodes, ...enrolledNodes];
        setNodes(allNodes);

        // Clear canvas with gradient
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(1, '#f5f7fa');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw title section
        drawTitleSection(ctx, canvas.width, graphType);

        // Draw edges with different styles based on type
        const edges = [
            // User to recommended courses
            ...recommendedNodes.map(node => ({
                from: userNode,
                to: node,
                label: 'Được gợi ý',
                style: 'recommended',
                showLabel: true
            })),
            // User to enrolled courses
            ...enrolledNodes.map(node => ({
                from: userNode,
                to: node,
                label: 'Đã học',
                style: 'enrolled',
                showLabel: true
            }))
        ];

        // Draw edges first (so they appear behind nodes)
        edges.forEach(edge => {
            drawEdge(ctx, edge);
        });

        // Draw nodes
        allNodes.forEach(node => {
            drawNode(ctx, node);
        });

        // Draw legend
        drawLegend(ctx, canvas.width, canvas.height);

    }, [courses, enrolledCourses, graphType]);

    const drawTitleSection = (ctx, width, type) => {
        const titles = {
            'profile-based': '📊 Biểu Đồ Gợi Ý Từ Hồ Sơ Cá Nhân',
            'collaborative': '📊 Biểu Đồ Gợi Ý Từ Cộng Đồng'
        };

        // Modern title with gradient text effect
        const titleGradient = ctx.createLinearGradient(20, 15, 20, 40);
        titleGradient.addColorStop(0, '#1e293b');
        titleGradient.addColorStop(1, '#475569');
        
        ctx.fillStyle = titleGradient;
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto';
        ctx.textAlign = 'left';
        
        // Text shadow for depth
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        ctx.fillText(titles[type] || '📊 Biểu Đồ Liên Kết', 25, 35);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // Decorative line under title
        const lineGradient = ctx.createLinearGradient(25, 45, 300, 45);
        lineGradient.addColorStop(0, '#6366f1');
        lineGradient.addColorStop(0.5, '#10b981');
        lineGradient.addColorStop(1, 'transparent');
        
        ctx.strokeStyle = lineGradient;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(25, 45);
        ctx.lineTo(300, 45);
        ctx.stroke();
    };

    const drawEdge = (ctx, edge) => {
        // Draw curved line for better visualization
        const startX = edge.from.x;
        const startY = edge.from.y;
        const endX = edge.to.x;
        const endY = edge.to.y;

        // Calculate control point for curve - offset more for longer curves
        const midX = (startX + endX) / 2;
        const distY = Math.abs(endY - startY);
        const curveOffset = Math.max(50, distY * 0.3); // Dynamic offset based on distance
        const midY = (startY + endY) / 2 + (edge.style === 'recommended' ? -curveOffset : curveOffset);

        // Draw line with gradient
        const lineGradient = ctx.createLinearGradient(startX, startY, endX, endY);
        if (edge.style === 'recommended') {
            lineGradient.addColorStop(0, '#6366f1aa');
            lineGradient.addColorStop(0.5, '#10b981cc');
            lineGradient.addColorStop(1, '#10b981aa');
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 5;
        } else {
            lineGradient.addColorStop(0, '#6366f1aa');
            lineGradient.addColorStop(0.5, '#f59e0bcc');
            lineGradient.addColorStop(1, '#f59e0baa');
            ctx.strokeStyle = lineGradient;
            ctx.lineWidth = 4.5;
        }
        
        // Draw shadow for edge
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Draw arrow at end
        const angle = Math.atan2(endY - startY, endX - startX);
        const arrowX = endX - Math.cos(angle) * (edge.to.radius + 5);
        const arrowY = endY - Math.sin(angle) * (edge.to.radius + 5);
        const arrowSize = 12;

        ctx.beginPath();
        ctx.moveTo(arrowX, arrowY);
        ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle - Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle - Math.PI / 6)
        );
        ctx.lineTo(
            arrowX - arrowSize * Math.cos(angle + Math.PI / 6),
            arrowY - arrowSize * Math.sin(angle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fillStyle = edge.style === 'recommended' ? '#10b981' : '#f59e0b';
        ctx.fill();

        // Draw label with background - positioned correctly on curve
        if (edge.showLabel) {
            // Calculate point on quadratic bezier curve at t=0.5 (midpoint of curve)
            const t = 0.5;
            const labelX = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * midX + t * t * endX;
            const labelY = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * midY + t * t * endY;
            
            // Calculate tangent angle for label orientation
            const tangentX = 2 * (1 - t) * (midX - startX) + 2 * t * (endX - midX);
            const tangentY = 2 * (1 - t) * (midY - startY) + 2 * t * (endY - midY);
            const tangentAngle = Math.atan2(tangentY, tangentX);
            
            // Offset label perpendicular to curve (above the line)
            const offsetDistance = 20;
            const normalAngle = tangentAngle - Math.PI / 2; // Perpendicular to tangent
            const labelOffsetX = labelX + Math.cos(normalAngle) * offsetDistance;
            const labelOffsetY = labelY + Math.sin(normalAngle) * offsetDistance;
            
            const text = edge.label;
            ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI"';
            const textMetrics = ctx.measureText(text);
            const textWidth = textMetrics.width;
            const padding = 8;
            const bgHeight = 20;
            
            // Modern label background with shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 2;
            
            // Background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.98)';
            ctx.beginPath();
            ctx.roundRect(
                labelOffsetX - textWidth / 2 - padding, 
                labelOffsetY - bgHeight / 2, 
                textWidth + padding * 2, 
                bgHeight, 
                6
            );
            ctx.fill();
            
            // Border
            ctx.strokeStyle = edge.style === 'recommended' ? '#10b981' : '#f59e0b';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Reset shadow
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            
            // Label text
            ctx.fillStyle = '#1e293b';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, labelOffsetX, labelOffsetY);
        }
    };

    const drawNode = (ctx, node) => {
        const isHovered = hoveredNode && hoveredNode.id === node.id;
        const scale = isHovered ? 1.1 : 1;
        const radius = node.radius * scale;

        // Draw outer glow (stronger for hovered)
        ctx.beginPath();
        ctx.arc(node.x, node.y, radius + 10, 0, Math.PI * 2);
        ctx.fillStyle = node.color + (isHovered ? '30' : '15');
        ctx.fill();

        // Draw shadow (stronger)
        ctx.beginPath();
        ctx.arc(node.x, node.y + 2, radius + 4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.fill();

        // Draw circle with modern gradient
        const nodeGradient = ctx.createRadialGradient(
            node.x - radius / 3,
            node.y - radius / 3,
            0,
            node.x,
            node.y,
            radius * 1.3
        );
        nodeGradient.addColorStop(0, node.secondaryColor || node.color);
        nodeGradient.addColorStop(0.5, node.color);
        nodeGradient.addColorStop(1, adjustColorBrightness(node.color, -40));

        ctx.beginPath();
        ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = nodeGradient;
        ctx.fill();

        // Modern border with gradient
        ctx.strokeStyle = isHovered ? '#ffffff' : 'rgba(255, 255, 255, 0.9)';
        ctx.lineWidth = isHovered ? 4 : 3;
        ctx.stroke();

        // Inner highlight circle for glass effect
        ctx.beginPath();
        ctx.arc(node.x - radius / 4, node.y - radius / 4, radius / 3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fill();

        // Draw icon if available
        if (node.icon) {
            ctx.font = `${radius * 0.5}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(node.icon, node.x, node.y - radius * 0.15);
        }

        // Draw text with better formatting
        ctx.fillStyle = 'white';
        ctx.font = `bold ${isHovered ? 15 : 13}px -apple-system, BlinkMacSystemFont, "Segoe UI"`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Text shadow for better readability
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 1;
        
        ctx.fillText(node.label, node.x, node.y + radius * 0.35);
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Draw rank badge for recommended nodes
        if (node.rank) {
            const badgeX = node.x + radius * 0.6;
            const badgeY = node.y - radius * 0.6;
            const badgeRadius = 14;
            
            // Badge background
            ctx.beginPath();
            ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Badge text
            ctx.fillStyle = '#78350f';
            ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${node.rank}`, badgeX, badgeY);
        }
    };

    const drawLegend = (ctx, width, height) => {
        const legendX = width - 200;
        const legendY = height - 150;
        const legendWidth = 185;
        const legendHeight = 135;

        // Modern shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 20;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 4;

        // Background with modern gradient
        const legendGradient = ctx.createLinearGradient(legendX, legendY, legendX, legendY + legendHeight);
        legendGradient.addColorStop(0, 'rgba(255, 255, 255, 0.98)');
        legendGradient.addColorStop(1, 'rgba(248, 250, 252, 0.98)');
        
        ctx.fillStyle = legendGradient;
        ctx.beginPath();
        ctx.roundRect(legendX, legendY, legendWidth, legendHeight, 12);
        ctx.fill();

        // Border with subtle gradient
        ctx.strokeStyle = 'rgba(226, 232, 240, 0.8)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;

        // Title with icon
        ctx.fillStyle = '#1e293b';
        ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI"';
        ctx.textAlign = 'left';
        ctx.fillText('📋 Chú Giải', legendX + 15, legendY + 25);

        // Divider line
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(legendX + 15, legendY + 35);
        ctx.lineTo(legendX + legendWidth - 15, legendY + 35);
        ctx.stroke();

        // Legend items with modern style
        const items = [
            { color: '#6366f1', secondaryColor: '#818cf8', label: '👤 Bạn', icon: '●' },
            { color: '#10b981', secondaryColor: '#34d399', label: '📚 Gợi ý', icon: '●' },
            { color: '#f59e0b', secondaryColor: '#fbbf24', label: '✓ Đã học', icon: '●' }
        ];

        items.forEach((item, i) => {
            const y = legendY + 55 + i * 28;
            
            // Modern color indicator with gradient
            const itemGradient = ctx.createRadialGradient(legendX + 20, y, 0, legendX + 20, y, 8);
            itemGradient.addColorStop(0, item.secondaryColor);
            itemGradient.addColorStop(1, item.color);
            
            ctx.beginPath();
            ctx.arc(legendX + 20, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = itemGradient;
            ctx.fill();
            
            // White border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // Label with better typography
            ctx.fillStyle = '#334155';
            ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI"';
            ctx.textAlign = 'left';
            ctx.fillText(item.label, legendX + 38, y + 4);
        });
    };

    const handleCanvasMouseMove = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setMousePos({ x, y });

        // Check if hovering over any node
        const hoveredNode = nodes.find(node => {
            const distance = Math.sqrt(
                Math.pow(node.x - x, 2) + Math.pow(node.y - y, 2)
            );
            return distance <= node.radius + 5;
        });

        setHoveredNode(hoveredNode || null);
        if (canvasRef.current) {
            canvasRef.current.style.cursor = hoveredNode ? 'pointer' : 'default';
        }
    };

    return (
        <div className="graph-visualization-wrapper" ref={containerRef}>
            <canvas
                ref={canvasRef}
                className="graph-canvas"
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={() => {
                    setHoveredNode(null);
                    if (canvasRef.current) canvasRef.current.style.cursor = 'default';
                }}
            />
            
            {/* Tooltip */}
            {hoveredNode && (
                <div 
                    className="graph-tooltip"
                    style={{
                        left: `${mousePos.x + 10}px`,
                        top: `${mousePos.y + 10}px`
                    }}
                >
                    <div className="tooltip-title">{hoveredNode.fullLabel}</div>
                    {hoveredNode.courseCode && (
                        <div className="tooltip-code">Mã: {hoveredNode.courseCode}</div>
                    )}
                    {hoveredNode.type === 'recommended' && (
                        <div className="tooltip-rank">Xếp hạng: #{hoveredNode.rank}</div>
                    )}
                    {hoveredNode.type === 'user' && (
                        <div className="tooltip-info">Học viên hiện tại</div>
                    )}
                </div>
            )}

            <div className="graph-info">
                <div className="info-item">
                    <span className="info-label">📚 Gợi ý:</span>
                    <span className="info-value">{courses.length} môn</span>
                </div>
                <div className="info-item">
                    <span className="info-label">✓ Đã học:</span>
                    <span className="info-value">{enrolledCourses.length} môn</span>
                </div>
                <div className="info-item">
                    <span className="info-label">🔗 Kết nối:</span>
                    <span className="info-value">{courses.length + enrolledCourses.length}</span>
                </div>
            </div>
        </div>
    );
};

// Helper function to adjust color brightness
function adjustColorBrightness(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return "#" + (
        0x1000000 +
        (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
        (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
        (B < 255 ? B < 1 ? 0 : B : 255)
    ).toString(16).slice(1);
}

export default GraphVisualization;
