import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

const LANES = [
  { id: 'BACKLOG', label: 'Backlog', color: 0x8794b2 },
  { id: 'IN_PROGRESS', label: 'In progress', color: 0x44b7ff },
  { id: 'IN_REVIEW', label: 'In review', color: 0xa78bfa },
  { id: 'DONE', label: 'Done', color: 0x42d6a0 }
];

export default function WorkspaceScene({ project, onNavigateTab }) {
  const sceneRef = useRef(null);
  const [webglError, setWebglError] = useState('');
  const stories = project.stories || [];
  const laneCounts = useMemo(() => ({
    BACKLOG: stories.filter((story) => story.status === 'BACKLOG' || story.status === 'TODO').length,
    IN_PROGRESS: stories.filter((story) => story.status === 'IN_PROGRESS').length,
    IN_REVIEW: stories.filter((story) => story.status === 'IN_REVIEW').length,
    DONE: stories.filter((story) => story.status === 'DONE').length
  }), [stories]);

  useEffect(() => {
    const host = sceneRef.current;
    if (!host) return undefined;

    let renderer;
    let animationFrame = 0;
    let resizeObserver;
    let dragStart = null;
    let moved = false;
    let targetRotationX = -0.22;
    let targetRotationY = -0.4;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    camera.position.set(7.5, 6, 10.5);
    camera.lookAt(0, 0.65, 0);

    const stage = new THREE.Group();
    scene.add(stage);
    scene.add(new THREE.HemisphereLight(0xb9c7ff, 0x101525, 2.2));

    const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    keyLight.position.set(-4, 8, 6);
    scene.add(keyLight);

    const fillLight = new THREE.PointLight(0x756bff, 22, 14);
    fillLight.position.set(4, 4, -3);
    scene.add(fillLight);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 8),
      new THREE.MeshStandardMaterial({ color: 0x11192b, metalness: 0.28, roughness: 0.7 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.04;
    stage.add(floor);

    const grid = new THREE.GridHelper(14, 28, 0x36466a, 0x25314b);
    grid.position.y = -0.025;
    stage.add(grid);

    const hitTargets = [];
    LANES.forEach((lane, index) => {
      const count = laneCounts[lane.id];
      const color = new THREE.Color(lane.color);
      const group = new THREE.Group();
      group.position.x = (index - 1.5) * 2.15;
      group.userData.status = lane.id;
      stage.add(group);

      const base = new THREE.Mesh(
        new THREE.BoxGeometry(1.7, 0.2, 2.3),
        new THREE.MeshStandardMaterial({ color: 0x1d2942, metalness: 0.38, roughness: 0.42 })
      );
      base.position.y = 0.14;
      base.userData.status = lane.id;
      group.add(base);

      const rim = new THREE.Mesh(
        new THREE.TorusGeometry(0.72, 0.018, 8, 48),
        new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 })
      );
      rim.rotation.x = -Math.PI / 2;
      rim.position.set(0, 0.25, 0);
      group.add(rim);

      const height = 0.48 + Math.min(count, 7) * 0.18;
      const pillar = new THREE.Mesh(
        new THREE.BoxGeometry(0.62, height, 0.72),
        new THREE.MeshStandardMaterial({
          color,
          emissive: color,
          emissiveIntensity: 0.22,
          metalness: 0.25,
          roughness: 0.3
        })
      );
      pillar.position.set(0, 0.26 + height / 2, 0);
      pillar.userData.status = lane.id;
      group.add(pillar);

      const cap = new THREE.Mesh(
        new THREE.BoxGeometry(0.66, 0.07, 0.76),
        new THREE.MeshStandardMaterial({ color: 0xf1f4ff, emissive: color, emissiveIntensity: 0.4 })
      );
      cap.position.set(0, height + 0.3, 0);
      group.add(cap);

      const markerCount = Math.min(count, 5);
      for (let markerIndex = 0; markerIndex < markerCount; markerIndex += 1) {
        const marker = new THREE.Mesh(
          new THREE.BoxGeometry(0.12, 0.12, 0.12),
          new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: 0.5 })
        );
        marker.position.set(
          -0.46 + (markerIndex % 3) * 0.46,
          0.31,
          markerIndex < 3 ? 0.83 : -0.83
        );
        group.add(marker);
      }

      hitTargets.push(group, base, pillar);
    });

    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.8));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.setClearColor(0x0b1120, 0);
      host.replaceChildren(renderer.domElement);
      setWebglError('');
    } catch (renderError) {
      console.error('Could not initialize the 3D workspace.', renderError);
      setWebglError('3D rendering is unavailable in this browser. You can still use the board below.');
      return undefined;
    }

    const resize = () => {
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    };

    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(host);
    } else {
      window.addEventListener('resize', resize);
    }
    resize();

    const pointerDown = (event) => {
      dragStart = { x: event.clientX, y: event.clientY, rotationX: targetRotationX, rotationY: targetRotationY };
      moved = false;
      renderer.domElement.setPointerCapture(event.pointerId);
    };

    const pointerMove = (event) => {
      if (!dragStart) return;
      const deltaX = event.clientX - dragStart.x;
      const deltaY = event.clientY - dragStart.y;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 4) moved = true;
      targetRotationY = dragStart.rotationY + deltaX * 0.0045;
      targetRotationX = Math.max(-0.38, Math.min(0.04, dragStart.rotationX + deltaY * 0.0025));
    };

    const pointerUp = (event) => {
      if (dragStart && !moved) {
        const bounds = renderer.domElement.getBoundingClientRect();
        const pointer = new THREE.Vector2(
          ((event.clientX - bounds.left) / bounds.width) * 2 - 1,
          -((event.clientY - bounds.top) / bounds.height) * 2 + 1
        );
        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(pointer, camera);
        const hit = raycaster.intersectObjects(hitTargets, true)[0]?.object;
        const status = hit?.userData.status || hit?.parent?.userData.status;
        if (status) onNavigateTab('kanban');
      }
      dragStart = null;
    };

    renderer.domElement.addEventListener('pointerdown', pointerDown);
    renderer.domElement.addEventListener('pointermove', pointerMove);
    renderer.domElement.addEventListener('pointerup', pointerUp);

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const renderFrame = () => {
      animationFrame = window.requestAnimationFrame(renderFrame);
      if (!dragStart && !reduceMotion) targetRotationY += 0.00045;
      stage.rotation.y += (targetRotationY - stage.rotation.y) * 0.035;
      stage.rotation.x += (targetRotationX - stage.rotation.x) * 0.035;
      renderer.render(scene, camera);
    };
    renderFrame();

    return () => {
      window.cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
      renderer.domElement.removeEventListener('pointerdown', pointerDown);
      renderer.domElement.removeEventListener('pointermove', pointerMove);
      renderer.domElement.removeEventListener('pointerup', pointerUp);
      scene.traverse((object) => {
        object.geometry?.dispose();
        if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
        else object.material?.dispose();
      });
      renderer.dispose();
    };
  }, [laneCounts, onNavigateTab]);

  return (
    <section className="workspace-scene-card" aria-label="Interactive 3D sprint workspace">
      <div className="workspace-scene-heading">
        <div>
          <span className="scene-eyebrow">LIVE WORKSPACE</span>
          <h2>Work in three dimensions</h2>
          <p>Drag to explore the sprint landscape. Select a lane to open the board.</p>
        </div>
        <span className="scene-live-pill"><span /> {stories.length} stories mapped</span>
      </div>
      {webglError ? (
        <div className="workspace-scene-fallback" role="status">{webglError}</div>
      ) : (
        <div ref={sceneRef} className="workspace-scene-viewport" aria-label="Drag to rotate the 3D status lanes" />
      )}
      <div className="workspace-scene-lanes">
        {LANES.map((lane) => (
          <button
            type="button"
            className="workspace-scene-lane"
            key={lane.id}
            onClick={() => onNavigateTab('kanban')}
          >
            <span className="workspace-scene-dot" style={{ backgroundColor: `#${lane.color.toString(16).padStart(6, '0')}` }} />
            <span>{lane.label}</span>
            <strong>{laneCounts[lane.id]}</strong>
          </button>
        ))}
      </div>
    </section>
  );
}
