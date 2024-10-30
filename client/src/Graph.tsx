import React, { useEffect } from 'react';
import * as d3 from 'd3';
import { ArtistRelationship, ProcessedArtist } from './Spotify';


const forceCenterStrength = 0.03;
const forceManyBodyStrength = -5000;
const radiusFactor = 20;
const linkStrengthFactor = 0.5;

type svgType = d3.Selection<SVGSVGElement, unknown, null, undefined>;
type d3SelectionType = d3.Selection<SVGCircleElement, unknown, SVGSVGElement, unknown>;
type tooltipType = d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;


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
        .select('#svg_class')
        .attr('viewBox', `0 0 ${width + (margin.left + margin.right)} ${height + (margin.top + margin.bottom)}`)
        .attr('width', width)
        .attr('height', height);

    // include the visualization in the nested group
    const group = svg
        .select('#svg_g')
        .attr('transform', `translate(${margin.left} ${margin.right})`);

    const tooltip = d3.select("#artist_name") // select the tooltip div for manipulation
        .style("position", "absolute") // the absolute position is necessary so that we can manually define its position later
        .style("visibility", "hidden") // hide it from default at the start so it only appears on hover
        .style("background-color", "white")
        .attr("class", "tooltip") as any;

    const simulation = d3.forceSimulation(nodes)
        .force('charge', d3.forceManyBody().strength(forceManyBodyStrength))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(forceCenterStrength))
        .force("collide", d3.forceCollide().radius((d: any) => d.radius).iterations(1))
        .force('link', d3.forceLink(links)
            .id((d: any) => d.id)
            .strength((d: any) => {
                return d.strength * linkStrengthFactor;
            }))
        .on('tick', () => ticked(group, nodes, tooltip))
        .force("x", d3.forceX(10))
        .force("y", d3.forceY(-10));

    const zoom = d3.zoom()
        .scaleExtent([0.01, 40])
        .filter(filter)
        .on("zoom", zoomed);

    group.attr("class", "view")
        .attr("x", 0.5)
        .attr("y", 0.5)
        .attr("width", width - 1)
        .attr("height", height - 1);
    function zoomed({ transform }: any) {
        group.attr("transform", transform);
    }

    svg.call(zoom as any);

    function filter(event: any) {
        event.preventDefault();
        return (!event.ctrlKey || event.type === 'wheel') && !event.button;
    }

}

function ticked(svg: any, nodes: any, tooltip: tooltipType) {
    updateNodes(svg, nodes, tooltip);
}

function stringToRandomNumber(str: string) {
    // Generate a simple hash from the string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; // Convert to a 32-bit integer
    }

    // Use the hash to generate a pseudo-random number between 0 and 1
    return (hash >>> 0) / 4294967295;
}

function stringToRandomInRange(str: string, min: number, max: number) {
    const randomFraction = stringToRandomNumber(str);
    return min + randomFraction * (max - min);
}

function getSavedArtistColor(d: any) {
    const blueHue = 240;
    const randomComponent = stringToRandomInRange(d.name, -25, 25);
    return `hsla(${blueHue + randomComponent}, 100%, 60%, 1)`;
}

function getSuggestedArtistColor(d: any) {
    const yellowHue = 60;
    const randomComponent = stringToRandomInRange(d.name, -15, 15);
    return `hsla(${yellowHue + randomComponent}, 100%, 30%, 1)`;
}

function updateNodes(svg: svgType, nodes: any, tooltip: tooltipType) {
    const node = svg
        .selectAll('circle')
        .data(nodes)
        .join('circle')
        .attr('r', function (d: any) {
            return d.radius;
        })
        .attr('cx', function (d: any) {
            return d.x;
        })
        .attr('cy', function (d: any) {
            return d.y;
        })
        .style('fill', (d: any) => d.savedTrackCount > 0 ? getSavedArtistColor(d) : getSuggestedArtistColor(d))
        .on("mouseover", tooltip_in) // when the mouse hovers a node, call the tooltip_in function to create the tooltip
        .on("mouseout", tooltip_out) // when the mouse stops hovering a node, call the tooltip_out function to get rid of the tooltip;


    function tooltip_in(event: any, d: any) { // pass event and d to this function so that it can access d for our data
        console.log(`Artist: ${d.name}`);
        return tooltip
            .html("<h4>" + d.name + "</h4>") // add an html element with a header tag containing the name of the node.  This line is where you would add additional information like: "<h4>" + d.name + "</h4></br><p>" + d.type + "</p>"  Note the quote marks, pluses and </br>--these are necessary for javascript to put all the data and strings within quotes together properly.  Any text needs to be all one line in .html() here
            .style("visibility", "visible") // make the tooltip visible on hover
            .style("top", event.pageY + "px") // position the tooltip with its top at the same pixel location as the mouse on the screen
            .style("left", event.pageX + "px"); // position the tooltip just to the right of the mouse location
    }

    function tooltip_out() {
        return tooltip
            .transition()
            .duration(50) // give the hide behavior a 50 milisecond delay so that it doesn't jump around as the network moves
            .style("visibility", "hidden"); // hide the tooltip when the mouse stops hovering
    }
}

const getRadius = (artist: ProcessedArtist) => {
    return artist.savedTrackCount > 0 ?
        (artist.savedTrackCount + 5) * radiusFactor :
        artist.score * radiusFactor;
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
        radius: getRadius(artist),
    }));

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
        executeD3(nodes, links);
    }, [nodes, links]);

    return (
        <div>
            <div id="artist_name" />
            <div className="viz" > 
                <svg id="svg_class">
                    <g id="svg_g" />
                </svg>
            </div>
        </div>
    );
};