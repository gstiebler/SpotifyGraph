import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { ArtistRelationship, ProcessedArtist } from './Spotify';


const forceCenterStrength = 0.1;
const forceManyBodyStrength = -2000;

type svgType = d3.Selection<SVGSVGElement, unknown, null, undefined>;
type d3SelectionType = d3.Selection<SVGCircleElement, unknown, SVGSVGElement, unknown>;

let simulation: any;

function executeD3(nodes: any, links: any) {
    // in the .viz container add an svg element following the margin convention
    const margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    };
    const width = 1500 - (margin.left + margin.right);
    const height = 600 - (margin.top + margin.bottom);

    const svg = d3
        .select('.viz')
        .append('svg')
        .attr('viewBox', `0 0 ${width + (margin.left + margin.right)} ${height + (margin.top + margin.bottom)}`)
        .attr('width', width)
        .attr('height', height);

    // include the visualization in the nested group
    const group = svg
        .append('g')
        .attr('transform', `translate(${margin.left} ${margin.right})`);

    simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(forceManyBodyStrength))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(forceCenterStrength))
        .force('link', d3.forceLink(links)
            .id((d: any) => d.id)
            .strength((d: any) => {
                return d.strength * 0.1;
            }))
        .on('tick', () => ticked(group, nodes, links))
        .force("x", d3.forceX(10))
        .force("y", d3.forceY(-10));

    const zoom = d3.zoom()
        .scaleExtent([0.01, 40])
        .translateExtent([[-1000, -1000], [width + 90, height + 100]])
        .filter(filter)
        .on("zoom", zoomed);

    group.attr("class", "view")
        .attr("x", 0.5)
        .attr("y", 0.5)
        .attr("width", width - 1)
        .attr("height", height - 1);
    function zoomed({ transform }: any) {
        group.attr("transform", transform);
        console.log(transform);
    }

    svg.call(zoom as any);

    function filter(event: any) {
        event.preventDefault();
        return (!event.ctrlKey || event.type === 'wheel') && !event.button;
    }

}

function ticked(svg: any, nodes: any, links: any) {
    // updateLinks(svg, links);
    updateNodes(svg, nodes);
}

function updateNodes(svg: svgType, nodes: any) {
    const node = svg
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('r', function (d: any) {
            return (d.savedTrackCount + 5) * 20;
        })
        .attr('cx', function (d: any) {
            return d.x;
        })
        .attr('cy', function (d: any) {
            return d.y;
        })
        .style('fill', (d: any) => d.savedTrackCount > 0 ? 'blue' : 'yellow');
}

export const Graph: React.FC<{
    artistsList: ProcessedArtist[],
    artistsRelationships: ArtistRelationship[],
    className?: string
}> = ({ artistsList, artistsRelationships, className }) => {
    const nodes = artistsList.map((artist, index) => ({
        name: artist.name,
        id: artist.id, index,
        savedTrackCount: artist.savedTrackCount,
    }));

    const [hasAddedComponents, setHasAddedComponents] = React.useState(false);

    const nodesMap = new Map(nodes.map((node) => [node.id, node]));

    const links = artistsRelationships.map((artistRelationships) => {
        const source = nodesMap.get(artistRelationships.artistId1);
        const target = nodesMap.get(artistRelationships.artistId2);
        if (!source || !target) {
            throw new Error(`Invalid artist relationship ${artistRelationships.artistId1} - ${artistRelationships.artistId2}`);
        }
        return {
            source,
            target,
            strength: artistRelationships.strength,
        }
    });

    useEffect(() => {
        if (nodes.length === 0 || links.length === 0 || hasAddedComponents) {
            return;
        }
        executeD3(nodes, links);
        setHasAddedComponents(true);
    }, [nodes, links, hasAddedComponents]);

    return (
        <div className="viz"></div>
    );
};