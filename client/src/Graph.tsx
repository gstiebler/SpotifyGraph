import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SGArtist } from './Spotify';

const width = 2000;
const height = 1000;

let simulation: any;

function executeD3(svg: any, nodes: any, links: any) {
    simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2).strength(0.1))
        .force('link', d3.forceLink(links).id((d: any) => d.id))
        .on('tick', () => ticked(svg, nodes, links))
        .force("x", d3.forceX())
        .force("y", d3.forceY());
}

function updateLinks(svg: any, links: any) {
    const u = svg
        .selectAll('line')
        .data(links)
        .join('line')
        .style('stroke', 'black')
        .attr('x1', function (d: any) {
            return d.source.x;
        })
        .attr('y1', function (d: any) {
            return d.source.y;
        })
        .attr('x2', function (d: any) {
            return d.target.x;
        })
        .attr('y2', function (d: any) {
            return d.target.y;
        });
}

function updateNodes(svg: any, nodes: any) {
    const node = svg
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('r', 5)
        .attr('cx', function (d: any) {
            return d.x;
        })
        .attr('cy', function (d: any) {
            return d.y;
        })
        .style('fill', 'blue');
    node.call(d3.drag()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
}

function ticked(svg: any, nodes: any, links: any) {
    updateLinks(svg, links);
    updateNodes(svg, nodes);
}

// Reheat the simulation when drag starts, and fix the subject position.
function dragstarted(event: any) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    event.subject.fx = event.subject.x;
    event.subject.fy = event.subject.y;
}

// Update the subject (dragged node) position during drag.
function dragged(event: any) {
    event.subject.fx = event.x;
    event.subject.fy = event.y;
}

// Restore the target alpha so the simulation cools after dragging ends.
// Unfix the subject position now that it’s no longer being dragged.
function dragended(event: any) {
    if (!event.active) simulation.alphaTarget(0);
    event.subject.fx = null;
    event.subject.fy = null;
}


export const Graph: React.FC<{
    artistsMap: Map<string, SGArtist>,
    artistsRelationshipPairs: string[][],
    className?: string
}> = ({ artistsMap, artistsRelationshipPairs, className }) => {
    const nodes = Array.from(artistsMap.values()).map((artist, index) => ({ name: artist.name, id: artist.id, index }));

    const nodesMap = new Map(nodes.map((node) => [node.id, node]));

    const links = artistsRelationshipPairs.map(([sourceId, targetId]) => ({
        source: nodesMap.get(sourceId),
        target: nodesMap.get(targetId),
    }));

    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
        if (svgRef.current) {
            const svg = d3.select(svgRef.current);
            executeD3(svg, nodes, links);
        }
    }, [links, nodes]);

    return (
        <svg ref={svgRef} className={className}></svg>
    );
};
