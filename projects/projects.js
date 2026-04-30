import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

let projectsData = [];
let searchInput = null;
let selectedYear = null;

async function loadProjects() {
    projectsData = await fetchJSON('../lib/projects.json');
    const projectsContainer = document.querySelector('.projects');
    
    if (projectsContainer) {
        renderProjects(projectsData, projectsContainer, 'h2');
    }
    
    const projectsTitle = document.querySelector('.projects-title');
    if (projectsTitle) {
        projectsTitle.innerHTML = `My Projects (${projectsData.length} projects)`;
    }
    
    renderPieChart(projectsData);
    setupSearch();
}

function renderPieChart(projectsToPlot) {
    if (!projectsToPlot || projectsToPlot.length === 0) {
        const svg = d3.select('#projects-pie-plot');
        svg.selectAll('*').remove();
        const legend = d3.select('.legend');
        legend.selectAll('*').remove();
        return;
    }
    
    let rolledData = d3.rollups(
        projectsToPlot,
        (v) => v.length,
        (d) => d.year
    );
    
    let data = rolledData.map(([year, count]) => {
        return { value: count, label: year };
    });
    
    // Sort data by year in ascending order
    data.sort((a, b) => {
        return parseInt(a.label) - parseInt(b.label);
    });
    
    let pieGenerator = d3.pie().value((d) => d.value);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    
    let arcData = pieGenerator(data);
    let arcs = arcData.map((d) => arcGenerator(d));
    
    let colors = d3.scaleOrdinal([
        '#9B59B6', '#2E86C1', '#E84393', '#8E44AD',
        '#1ABC9C', '#3498DB', '#D3548C', '#6C5CE7'
    ]);
    
    const svg = d3.select('#projects-pie-plot');
    svg.selectAll('*').remove();
    
    arcs.forEach((arc, idx) => {
        const year = data[idx].label;
        svg.append('path')
            .attr('d', arc)
            .attr('fill', colors(idx))
            .attr('class', selectedYear === year ? 'selected' : '')
            .attr('data-year', year)
            .on('click', () => {
                if (selectedYear === year) {
                    selectedYear = null;
                } else {
                    selectedYear = year;
                }
                applyFilters();
                updateSelectionStyling();
            });
    });
    
    const legend = d3.select('.legend');
    legend.selectAll('*').remove();
    
    data.forEach((d, idx) => {
        const year = d.label;
        legend
            .append('li')
            .attr('style', `--color: ${colors(idx)}`)
            .attr('class', `legend-item ${selectedYear === year ? 'selected' : ''}`)
            .attr('data-year', year)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
            .on('click', () => {
                if (selectedYear === year) {
                    selectedYear = null;
                } else {
                    selectedYear = year;
                }
                applyFilters();
                updateSelectionStyling();
            });
    });
}

function updateSelectionStyling() {
    const svg = d3.select('#projects-pie-plot');
    svg.selectAll('path').attr('class', function() {
        const year = d3.select(this).attr('data-year');
        return selectedYear === year ? 'selected' : '';
    });
    
    const legend = d3.select('.legend');
    legend.selectAll('li').attr('class', function() {
        const year = d3.select(this).attr('data-year');
        return `legend-item ${selectedYear === year ? 'selected' : ''}`;
    });
}

function applyFilters() {
    let filteredProjects = [...projectsData];
    
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    if (searchQuery) {
        filteredProjects = filteredProjects.filter(project => {
            let searchableText = Object.values(project).join(' ').toLowerCase();
            return searchableText.includes(searchQuery);
        });
    }
    
    if (selectedYear) {
        filteredProjects = filteredProjects.filter(project => project.year === selectedYear);
    }
    
    const projectsTitle = document.querySelector('.projects-title');
    if (projectsTitle) {
        projectsTitle.innerHTML = `My Projects (${filteredProjects.length} projects)`;
    }
    
    const projectsContainer = document.querySelector('.projects');
    if (projectsContainer) {
        renderProjects(filteredProjects, projectsContainer, 'h2');
    }
    
    renderPieChart(filteredProjects);
}

function setupSearch() {
    searchInput = document.querySelector('.searchBar');
    if (!searchInput) return;
    
    searchInput.addEventListener('input', (event) => {
        applyFilters();
        updateSelectionStyling();
    });
}

loadProjects();