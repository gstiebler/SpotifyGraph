import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';

const nodes = [
    { name: 'A' },
    { name: 'B' },
    { name: 'C' },
    { name: 'D' },
    { name: 'E' },
    { name: 'F' },
    { name: 'G' },
    { name: 'H' },
  ] as any;
  
  const links = [
    { source: nodes[0], target: nodes[1] },
    { source: nodes[0], target: nodes[2] },
    { source: nodes[0], target: nodes[3] },
    { source: nodes[1], target: nodes[6] },
    { source: nodes[3], target: nodes[4] },
    { source: nodes[3], target: nodes[7] },
    { source: nodes[4], target: nodes[5] },
    { source: nodes[4], target: nodes[7] }
  ];
  
  function executeD3(svg: any) {
    const width = 400, height = 300;
    const simulation = d3.forceSimulation(nodes)
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('link', d3.forceLink(links).id((d: any) => d.index))
      .on('tick', () => ticked(svg));
  }
  
  function updateLinks(svg: any) {
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
  
  function updateNodes(svg: any) {
    const u = svg
      .selectAll('text')
      .data(nodes)
      .join('text')
      .text(function (d: any) {
        return d.name;
      })
      .attr('x', function (d: any) {
        return d.x;
      })
      .attr('y', function (d: any) {
        return d.y;
      })
      .attr('dy', function (d: any) {
        return 5;
      });
  }
  
  function ticked(svg: any) {
    updateNodes(svg);
    updateLinks(svg);
  }
  

export const Graph: React.FC = () => {


    const svgRef = useRef<SVGSVGElement | null>(null);

    useEffect(() => {
      if (svgRef.current) {
        const svg = d3.select(svgRef.current);
        executeD3(svg);
      }
    }, []);
    
    return (
        <svg ref={svgRef} width={500} height={300} />
    );
};
