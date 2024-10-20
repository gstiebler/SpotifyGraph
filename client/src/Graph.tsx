import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ArtistRelationship, ProcessedArtist } from './Spotify';

const width = 1000;
const height = 600;

const forceCenterStrength = 0.1;
const forceManyBodyStrength = -2000;

type svgType = d3.Selection<SVGSVGElement, unknown, null, undefined>;
type d3SelectionType = d3.Selection<SVGCircleElement, unknown, SVGSVGElement, unknown>;

let simulation: any;

function executeD3(svg: svgType, nodes: any, links: any) {
    simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(forceManyBodyStrength))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(forceCenterStrength))
        .force('link', d3.forceLink(links)
            .id((d: any) => d.id)
            .strength((d: any) => {
                return d.strength * 0.1;
            }))
        .on('tick', () => ticked(svg, nodes, links))
        .force("x", d3.forceX(10))
        .force("y", d3.forceY(-10));
}

function updateLinks(svg: svgType, links: any) {
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

function updateNodes(svg: svgType, nodes: any) {
    const node = svg
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('r', function (d: any) {
            return d.savedTrackCount + 5;
        })
        .attr('cx', function (d: any) {
            return d.x;
        })
        .attr('cy', function (d: any) {
            return d.y;
        })
        .style('fill', (d: any) => d.savedTrackCount > 0 ? 'blue' : 'yellow');

    (node as d3SelectionType).call(d3.drag<SVGCircleElement, unknown>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended));
}

function ticked(svg: svgType, nodes: any, links: any) {
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
    artistsMap: Map<string, ProcessedArtist>,
    artistRelationships: ArtistRelationship[],
    className?: string
}> = ({ artistsMap, artistRelationships: artistsRelationships, className }) => {
    const nodes = Array.from(artistsMap.values()).map((artist, index) => ({ 
        name: artist.name, 
        id: artist.id, index,
        savedTrackCount: artist.savedTrackCount,
    }));

    const nodesMap = new Map(nodes.map((node) => [node.id, node]));

    const links = artistsRelationships.map((artistRelationships) => ({
        source: nodesMap.get(artistRelationships.artistId1),
        target: nodesMap.get(artistRelationships.artistId2),
        strength: artistRelationships.strength,
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
