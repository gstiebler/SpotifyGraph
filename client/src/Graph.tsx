import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { SimplifiedArtist } from '@spotify/web-api-ts-sdk';

function executeD3(svg: any, nodes: any, links: any) {
    const width = 400, height = 300;
    const simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(-100))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('link', d3.forceLink(links).id((d: any) => d.index))
        .on('tick', () => ticked(svg, nodes, links));
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
    const u = svg
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
}

function ticked(svg: any, nodes: any, links: any) {
    updateNodes(svg, nodes);
    updateLinks(svg, links);
}


export const Graph: React.FC<{
    artistsMap: Map<string, SimplifiedArtist>,
    artistsRelationshipPairs: string[][],
}> = ({ artistsMap, artistsRelationshipPairs }) => {
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
        <svg ref={svgRef} width={500} height={300} />
    );
};
