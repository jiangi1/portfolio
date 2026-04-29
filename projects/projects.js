import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadProjects() {
    const projects = await fetchJSON('../lib/projects.json');
    const projectsContainer = document.querySelector('.projects');
    
    if (projectsContainer) {
        renderProjects(projects, projectsContainer, 'h2');
    }
    
    const projectsTitle = document.querySelector('.projects-title');
    if (projectsTitle) {
        projectsTitle.innerHTML = `My Projects (${projects.length} projects)`;
    }
    
    let rolledData = d3.rollups(
        projects,
        (v) => v.length, 
        (d) => d.year    
    );
    
    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });
    
    let pieGenerator = d3.pie().value((d) => d.value);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    
    let arcData = pieGenerator(data);
    let arcs = arcData.map((d) => arcGenerator(d));
    
    let colors = d3.scaleOrdinal([
        '#9B59B6',  // Purple (accent)
        '#2E86C1',  // Deep blue
        '#E84393',  // Hot pink
        '#8E44AD',  // Dark purple
        '#1ABC9C',  // Teal
        '#3498DB',  // Bright blue
        '#D3548C',  // Dusky pink
        '#6C5CE7',  // Periwinkle
    ]);

    const svg = d3.select('#projects-pie-plot');
    svg.selectAll('*').remove();
    
    arcs.forEach((arc, idx) => {
        svg.append('path')
            .attr('d', arc)
            .attr('fill', colors(idx));
    });
    
    const legend = d3.select('.legend');
    legend.selectAll('*').remove();
    
    data.forEach((d, idx) => {
        legend
            .append('li')
            .attr('style', `--color: ${colors(idx)}`)
            .attr('class', 'legend-item')
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });
}

loadProjects();