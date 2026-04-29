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
    
    // STEP 1.4: Static pie chart with two slices
    let data = [1, 2];
    let total = 0;
    for (let d of data) {
        total += d;
    }
    
    let angle = 0;
    let arcData = [];
    for (let d of data) {
        let endAngle = angle + (d / total) * 2 * Math.PI;
        arcData.push({ startAngle: angle, endAngle });
        angle = endAngle;
    }
    
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let arcs = arcData.map((d) => arcGenerator(d));
    
    let colors = ['gold', 'purple'];
    
    const svg = d3.select('#projects-pie-plot');
    svg.selectAll('*').remove();
    
    arcs.forEach((arc, idx) => {
        svg.append('path')
            .attr('d', arc)
            .attr('fill', colors[idx]);
    });
}

loadProjects();