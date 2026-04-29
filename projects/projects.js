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
    
    let data = [1, 2, 3, 4, 5, 5];
    
    let pieGenerator = d3.pie();
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    
    let arcData = pieGenerator(data);
    let arcs = arcData.map((d) => arcGenerator(d));
    
    let colors = d3.scaleOrdinal(d3.schemeTableau10);
    
    const svg = d3.select('#projects-pie-plot');
    svg.selectAll('*').remove();
    
    arcs.forEach((arc, idx) => {
        svg.append('path')
            .attr('d', arc)
            .attr('fill', colors(idx));
    });
}

loadProjects();