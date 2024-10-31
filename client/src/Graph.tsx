import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { useRecoilValue } from 'recoil';
import { ArtistRelationship, ProcessedArtist } from './Spotify';
import {
  artistsListState,
  artistRelationshipsState,
  forceCenterStrengthState,
  forceManyBodyStrengthState,
  linkStrengthFactorState,
} from './state/graphState';

const radiusFactor = 20;

type svgType = d3.Selection<SVGSVGElement, unknown, null, undefined>;
type tooltipType = d3.Selection<HTMLDivElement, unknown, HTMLElement, any>;


function executeD3(
    nodes: any,
    links: any,
    forceCenterStrength: number,
    forceManyBodyStrength: number,
    linkStrengthFactor: number,
    width: number,
    height: number
) {
    const svg = d3.select('#svg_class')
    svg.selectAll('*').remove();

    // Remove fixed width/height and use 100%
    svg.attr('width', '100%')
       .attr('height', '100%')
       .attr('viewBox', `0 0 ${width} ${height}`)
       .attr('preserveAspectRatio', 'xMidYMid meet')
       .style('background-color', 'black');

    // in the .viz container add an svg element following the margin convention
    const margin = {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20,
    };

    svg.attr('viewBox', `0 0 ${width + (margin.left + margin.right)} ${height + (margin.top + margin.bottom)}`)
        .attr('width', width)
        .attr('height', height)
        .style('background-color', 'black'); // Add this line

    // include the visualization in the nested group
    const group = svg
        .append('g')
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

    svg.call(zoom as any)
        .call(zoom.transform as any, d3.zoomIdentity.translate(width / 2, height / 2).scale(0.02));

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
    const greenHue = 120;
    const colorRange = 25;
    const randomComponent = stringToRandomInRange(d.name, -colorRange, colorRange);
    return `hsla(${greenHue + randomComponent}, 100%, 70%, 0.7)`;
}

function getSuggestedArtistColor(d: any) {
    const yellowHue = 283;
    const colorRange = 5;
    const randomComponent = stringToRandomInRange(d.name, -colorRange, colorRange);
    return `hsla(${yellowHue + randomComponent}, 39%, 56%, 0.9)`;
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
        .on("mousemove", tooltip_in) // when the mouse hovers a node, call the tooltip_in function to create the tooltip
        .on("mouseout", tooltip_out);


    function tooltip_in(event: any, d: any) { // pass event and d to this function so that it can access d for our data
        const backgroundColor = d.savedTrackCount > 0 ? '#D2F9E0' : '#F1E6FE';
        
        return tooltip
            .html("<h4>" + d.name + "</h4>")
            .style("visibility", "visible")
            .style("top", event.pageY + "px")
            .style("left", event.pageX + "px")
            .style("background-color", backgroundColor)
            .style("color", "#000000")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("font-family", "Arial, sans-serif");
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

interface GraphProps {
 
}

export const Graph: React.FC<GraphProps> = () => {
  const artistsList = useRecoilValue(artistsListState);
  const artistsRelationships = useRecoilValue(artistRelationshipsState);
  const forceCenterStrength = useRecoilValue(forceCenterStrengthState);
  const forceManyBodyStrength = useRecoilValue(forceManyBodyStrengthState);
  const linkStrengthFactor = useRecoilValue(linkStrengthFactorState);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    // Initial dimensions
    updateDimensions();

    // Add resize listener
    window.addEventListener('resize', updateDimensions);

    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

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
    if (dimensions.width && dimensions.height) {
      executeD3(nodes, links, forceCenterStrength, forceManyBodyStrength, linkStrengthFactor, dimensions.width, dimensions.height);
    }
  }, [nodes, links, forceCenterStrength, forceManyBodyStrength, linkStrengthFactor, dimensions]);

  return (
    <div id="d3-container" ref={containerRef}>
      <div id="artist_name" />
      <div className="viz">
        <svg id="svg_class" />
      </div>
    </div>
  );
};