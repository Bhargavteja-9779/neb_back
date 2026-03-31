import React, { useEffect, useState, useRef, useMemo } from 'react';
import Globe from 'react-globe.gl';
import * as THREE from 'three';
import { socket } from '../services/api';

// Major global tech hubs [lng, lat]
const GLOBAL_LOCATIONS = [
  { id: 'ny', name: 'New York', lat: 40.7128, lng: -74.006 },
  { id: 'london', name: 'London', lat: 51.5074, lng: -0.1276 },
  { id: 'tokyo', name: 'Tokyo', lat: 35.6895, lng: 139.6917 },
  { id: 'sf', name: 'San Francisco', lat: 37.7749, lng: -122.4194 },
  { id: 'frankfurt', name: 'Frankfurt', lat: 50.1109, lng: 8.6821 },
  { id: 'singapore', name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { id: 'sydney', name: 'Sydney', lat: -33.8688, lng: 151.2093 },
  { id: 'saopaulo', name: 'Sao Paulo', lat: -23.5505, lng: -46.6333 },
  { id: 'capetown', name: 'Cape Town', lat: -33.9249, lng: 18.4232 },
  { id: 'mumbai', name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { id: 'toronto', name: 'Toronto', lat: 43.6532, lng: -79.3832 },
  { id: 'paris', name: 'Paris', lat: 48.8566, lng: 2.3522 },
];

export default function ComputeVisualization({ failedNode, isTraining }) {
  const globeRef = useRef();
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const containerRef = useRef();
  const [isHovered, setIsHovered] = useState(false);

  // Three.js Objects for Cinematic layers
  const ringsRef = useRef([]);
  const scanningLightRef = useRef();

  // Resize handler
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize nodes and connections
  useEffect(() => {
    const initialNodes = GLOBAL_LOCATIONS.slice(0, 10).map((loc, i) => ({
      ...loc,
      size: i < 3 ? 0.6 : 0.4,
      color: i < 3 ? '#3B82F6' : '#22C55E', 
      isCore: i < 3
    }));

    const initialConnections = [];
    for (let i = 0; i < initialNodes.length; i++) {
      const numConns = Math.floor(Math.random() * 2) + 1;
      for (let j = 0; j < numConns; j++) {
        const target = initialNodes[Math.floor(Math.random() * initialNodes.length)];
        if (target.id !== initialNodes[i].id) {
          initialConnections.push({
            startLat: initialNodes[i].lat,
            startLng: initialNodes[i].lng,
            endLat: target.lat,
            endLng: target.lng,
            color: ['#3B82F6', '#8B5CF6']
          });
        }
      }
    }

    setNodes(initialNodes);
    setConnections(initialConnections);
  }, []);

  // Configure Cinematic Scene
  useEffect(() => {
    if (!globeRef.current) return;

    const scene = globeRef.current.scene();
    
    // 1. Rim Lighting (SpotLight)
    const rimLight = new THREE.SpotLight('#8B5CF6', 2);
    rimLight.position.set(-100, 100, -100);
    rimLight.angle = Math.PI / 4;
    rimLight.penumbra = 0.5;
    scene.add(rimLight);

    // 2. Scanning Light (PointLight)
    const scanLight = new THREE.PointLight('#3B82F6', 1.5, 500);
    scanLight.position.set(150, 0, 150);
    scene.add(scanLight);
    scanningLightRef.current = scanLight;

    // 3. Energy Rings
    const ringMaterial = new THREE.MeshBasicMaterial({
      color: '#3B82F6',
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    });

    for (let i = 0; i < 3; i++) {
        const radius = 105 + (i * 8);
        const ringGeo = new THREE.RingGeometry(radius, radius + 0.5, 128);
        const ring = new THREE.Mesh(ringGeo, ringMaterial);
        ring.rotation.x = Math.PI / 2 + (Math.random() - 0.5) * 0.2;
        ring.rotation.y = (Math.random() - 0.5) * 0.2;
        scene.add(ring);
        ringsRef.current.push(ring);
    }

    // 4. Animation Frame for Cinematic Motion
    let frame = 0;
    const animate = () => {
        frame += 0.01;
        
        // Rotate Rings
        ringsRef.current.forEach((r, i) => {
            r.rotation.z += 0.002 * (i + 1);
        });

        // Scanning Light movement
        if (scanningLightRef.current) {
            scanningLightRef.current.position.x = 180 * Math.cos(frame * 0.5);
            scanningLightRef.current.position.z = 180 * Math.sin(frame * 0.5);
            scanningLightRef.current.position.y = 50 * Math.sin(frame * 0.2);
        }

        // Breathing Camera (subtle altitude oscillation)
        if (globeRef.current) {
            const currentPov = globeRef.current.pointOfView();
            const targetAlt = 2.2 + Math.sin(frame * 0.3) * 0.1;
            // Only update if not being dragged
            if (!globeRef.current.controls().isDragging) {
                // We don't want to call pointOfView every frame as it might override controls fully
                // but for a slow drift it works if we use the altitude parameter specifically
                // globeRef.current.pointOfView({ altitude: targetAlt });
            }
        }

        requestAnimationFrame(animate);
    };
    const animId = requestAnimationFrame(animate);

    // Initial viewpoint
    globeRef.current.pointOfView({ lat: 20, lng: 0, altitude: 2.2 });
    const controls = globeRef.current.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;
    // Disable all user interaction by default — enabled on hover
    controls.enabled = false;
    controls.enableZoom = false;
    controls.minDistance = 150;
    controls.maxDistance = 600;

    return () => {
        cancelAnimationFrame(animId);
        // cleanup scene
        scene.remove(rimLight);
        scene.remove(scanLight);
        ringsRef.current.forEach(r => scene.remove(r));
    };
  }, []);

  // Handle socket node joins
  useEffect(() => {
    const handleNodeJoin = (data) => {
      const baseLoc = GLOBAL_LOCATIONS[Math.floor(Math.random() * GLOBAL_LOCATIONS.length)];
      const newNode = {
        id: data.id || `node_${Date.now()}`,
        lat: baseLoc.lat + (Math.random() - 0.5) * 8,
        lng: baseLoc.lng + (Math.random() - 0.5) * 8,
        size: 0.5,
        color: '#EAB308',
        justJoined: true
      };

      setNodes(prev => [...prev, newNode]);

      const targets = [...nodes].sort(() => 0.5 - Math.random()).slice(0, 2);
      targets.forEach(t => {
        setConnections(prev => [...prev, {
          startLat: newNode.lat,
          startLng: newNode.lng,
          endLat: t.lat,
          endLng: t.lng,
          color: ['#EAB308', '#3B82F6']
        }]);
      });

      setTimeout(() => {
        setNodes(curr => curr.map(n => n.id === newNode.id ? { ...n, color: '#22C55E', justJoined: false } : n));
      }, 3000);
    };

    socket.on('node_joined', handleNodeJoin);
    return () => socket.off('node_joined', handleNodeJoin);
  }, [nodes]);

  // Enable/disable orbit controls on hover
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.enabled = true;
      controls.enableRotate = true;
      controls.enablePan = false;
      controls.enableZoom = true;
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (globeRef.current) {
      const controls = globeRef.current.controls();
      controls.enabled = false;
      controls.enableZoom = false;
    }
  };

  // Capture wheel on the globe so page doesn't scroll while zooming
  const handleWheel = (e) => {
    if (isHovered) {
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${
        isHovered ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      style={{ touchAction: 'pan-y' }}
    >
      <Globe
        ref={globeRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        
        showAtmosphere={true}
        atmosphereColor="#3B82F6"
        atmosphereAltitude={0.25}

        pointsData={nodes}
        pointLat="lat"
        pointLng="lng"
        pointColor="color"
        pointRadius="size"
        pointsMerge={true}
        pointAltitude={0.01}
        
        arcsData={connections}
        arcStartLat="startLat"
        arcStartLng="startLng"
        arcEndLat="endLat"
        arcEndLng="endLng"
        arcColor="color"
        arcDashLength={() => 0.3 + Math.random() * 0.2}
        arcDashGap={4}
        arcDashInitialGap={() => Math.random() * 5}
        arcDashAnimateTime={isTraining ? 1000 : 2500}
        arcStroke={0.5}
        arcAltitudeAutoScale={0.3}

        ringsData={nodes.filter(n => n.justJoined)}
        ringLat="lat"
        ringLng="lng"
        ringColor={() => '#EAB308'}
        ringMaxRadius={12}
        ringPropagationSpeed={4}
        ringRepeatPeriod={800}
      />

      {/* Glow overlay — visible on hover */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] pointer-events-none -z-10 transition-opacity duration-500"
        style={{
          background: 'radial-gradient(circle at center, rgba(139,92,246,0.05) 0%, transparent 60%)',
          opacity: isHovered ? 1 : 0.5,
        }}
      />
    </div>
  );
}
