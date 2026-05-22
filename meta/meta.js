import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import scrollama from 'https://cdn.jsdelivr.net/npm/scrollama@3.2.0/+esm';

let commits = [];
let filteredCommits = [];
let xScale = null;
let yScale = null;
let svg = null;
let radiusScale = null;
let timeScale = null;
let scroller = null;
let fileColorScale = d3.scaleOrdinal(['#4c72b0', '#dd8452', '#55a868', '#c44e52', '#8172b2', '#ccb974', '#9467bd']);

async function loadData() {
    const data = await d3.csv('loc.csv', (row) => {
        let date = new Date(row.datetime);
        return {
            ...row,
            line: Number(row.line) || 0,
            depth: Number(row.depth) || 0,
            length: Number(row.length) || 0,
            datetime: date,
            hourFrac: date.getHours() + date.getMinutes() / 60,
            type: row.file ? row.file.split('.').pop() : 'unknown'
        };
    });
    return data;
}

function processCommits(data) {
    const commitsMap = new Map();
    data.forEach(row => {
        if (!row.commit) return;
        if (!commitsMap.has(row.commit)) {
            commitsMap.set(row.commit, {
                id: row.commit,
                lines: [],
                datetime: row.datetime,
                author: row.author || 'Unknown',
                url: 'https://github.com/jiangi1/portfolio/commit/' + row.commit
            });
        }
        commitsMap.get(row.commit).lines.push(row);
    });
    
    return Array.from(commitsMap.values())
        .map(commit => ({
            ...commit,
            totalLines: commit.lines.length,
            hourFrac: commit.datetime.getHours() + commit.datetime.getMinutes() / 60
        }))
        .sort((a, b) => a.datetime - b.datetime);
}

function renderStats(commitsData) {
    const totalLoc = commitsData.flatMap(d => d.lines).length;
    const fileCount = new Set(commitsData.flatMap(d => d.lines.map(l => l.file))).size;
    
    const theme = document.documentElement.getAttribute('data-theme');
    let isDark = false;
    if (theme === 'dark') {
        isDark = true;
    } else if (theme === 'auto') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    
    let bgColor, labelColor, valueColor;
    if (isDark) {
        bgColor = 'rgba(255, 255, 255, 0.08)';
        labelColor = '#ccc';
        valueColor = '#ffffff';
    } else {
        bgColor = 'rgba(0, 0, 0, 0.05)';
        labelColor = '#555';
        valueColor = '#1a1a2e';
    }
    
    const statsHtml = `
        <div style="display: flex; justify-content: space-around; gap: 1rem; padding: 1.2rem; background: ${bgColor}; border-radius: 12px; text-align: center; margin: 1rem 0;">
            <div style="flex: 1;">
                <div style="font-size: 0.9rem; font-weight: 500; color: ${labelColor};">Total LOC</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: ${valueColor}; margin-top: 0.3rem;">${totalLoc}</div>
            </div>
            <div style="flex: 1;">
                <div style="font-size: 0.9rem; font-weight: 500; color: ${labelColor};">Total commits</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: ${valueColor}; margin-top: 0.3rem;">${commitsData.length}</div>
            </div>
            <div style="flex: 1;">
                <div style="font-size: 0.9rem; font-weight: 500; color: ${labelColor};">Files</div>
                <div style="font-size: 1.5rem; font-weight: 700; color: ${valueColor}; margin-top: 0.3rem;">${fileCount}</div>
            </div>
        </div>
    `;
    d3.select('#stats').html(statsHtml);
}

function renderTooltipContent(commit) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.innerHTML = `
        <dt>Commit</dt><dd>${commit.id.slice(0, 7)}</dd>
        <dt>Date</dt><dd>${commit.datetime.toLocaleDateString()}</dd>
        <dt>Time</dt><dd>${commit.datetime.toLocaleTimeString()}</dd>
        <dt>Lines edited</dt><dd>${commit.totalLines}</dd>
    `;
}

function renderScatterPlot(commitsData) {
    const width = 1400;
    const height = 700;
    const margin = { top: 30, right: 50, bottom: 100, left: 120 };
    
    d3.select('#chart').selectAll('svg').remove();
    
    svg = d3.select('#chart')
        .append('svg')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('width', '100%')
        .style('height', 'auto')
        .style('min-height', '550px')
        .style('background', 'transparent')
        .style('overflow', 'visible');
    
    xScale = d3.scaleTime()
        .domain(d3.extent(commitsData, d => d.datetime))
        .range([margin.left, width - margin.right]);
    
    yScale = d3.scaleLinear()
        .domain([0, 24])
        .range([height - margin.bottom, margin.top]);
    
    const [minLines, maxLines] = d3.extent(commitsData, d => d.totalLines);
    radiusScale = d3.scaleSqrt().domain([minLines || 1, maxLines || 10]).range([6, 35]);
    
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%b %d, %Y'))
        .ticks(8);
    
    const xAxisGroup = svg.append('g')
        .attr('transform', `translate(0, ${height - margin.bottom})`)
        .attr('class', 'x-axis')
        .call(xAxis);
    
    xAxisGroup.selectAll('text')
        .style('font-size', '20px')
        .style('font-family', 'system-ui, sans-serif')
        .attr('transform', 'rotate(-15)')
        .attr('dx', '-0.5em')
        .attr('dy', '0.5em')
        .style('text-anchor', 'end');
    
    const yAxis = d3.axisLeft(yScale)
        .tickValues([0, 3, 6, 9, 12, 15, 18, 21, 24])
        .tickFormat(d => {
            if (d === 0) return '12 AM';
            if (d === 12) return '12 PM';
            if (d < 12) return `${d} AM`;
            return `${d - 12} PM`;
        });
    
    const yAxisGroup = svg.append('g')
        .attr('transform', `translate(${margin.left}, 0)`)
        .attr('class', 'y-axis')
        .call(yAxis);
    
    yAxisGroup.selectAll('text')
        .style('font-size', '20px')
        .style('font-family', 'system-ui, sans-serif');
    
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', height - 15)
        .attr('text-anchor', 'middle')
        .style('font-size', '22px')
        .style('font-weight', 'bold')
        .style('fill', '#666')
        .text('Commit Date');
    
    svg.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(height / 2))
        .attr('y', margin.left - 80)
        .attr('text-anchor', 'middle')
        .style('font-size', '22px')
        .style('font-weight', 'bold')
        .style('fill', '#666')
        .text('Time of Day');
    
    svg.append('g')
        .attr('class', 'gridlines')
        .attr('transform', `translate(${margin.left}, 0)`)
        .call(d3.axisLeft(yScale)
            .tickValues([0, 3, 6, 9, 12, 15, 18, 21, 24])
            .tickFormat('')
            .tickSize(-(width - margin.left - margin.right)))
        .style('color', '#ddd')
        .style('opacity', 0.3);
    
    svg.selectAll('.gridlines .domain').remove();
    
    svg.selectAll('circle')
        .data(commitsData)
        .join('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => radiusScale(d.totalLines))
        .attr('data-commit-id', d => d.id)
        .attr('fill', 'steelblue')
        .attr('opacity', 0.7)
        .on('mouseenter', (event, d) => {
            d3.select(event.currentTarget).attr('opacity', 1).attr('fill', '#ff6b6b');
            renderTooltipContent(d);
            const tooltip = document.getElementById('commit-tooltip');
            tooltip.hidden = false;
            tooltip.style.left = `${event.clientX + 15}px`;
            tooltip.style.top = `${event.clientY + 15}px`;
        })
        .on('mousemove', (event) => {
            const tooltip = document.getElementById('commit-tooltip');
            tooltip.style.left = `${event.clientX + 15}px`;
            tooltip.style.top = `${event.clientY + 15}px`;
        })
        .on('mouseleave', (event) => {
            d3.select(event.currentTarget).attr('opacity', 0.7).attr('fill', 'steelblue');
            document.getElementById('commit-tooltip').hidden = true;
        });
}

function updateScatterPlot(commitsData) {
    if (!svg) return;
    xScale.domain(d3.extent(commitsData, d => d.datetime));
    
    svg.selectAll('circle')
        .data(commitsData)
        .join('circle')
        .attr('cx', d => xScale(d.datetime))
        .attr('cy', d => yScale(d.hourFrac))
        .attr('r', d => radiusScale(d.totalLines))
        .attr('data-commit-id', d => d.id)
        .attr('fill', 'steelblue')
        .attr('opacity', 0.7);
    
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d3.timeFormat('%b %d, %Y'))
        .ticks(8);
    
    const xAxisGroup = svg.select('.x-axis');
    xAxisGroup.call(xAxis);
    
    xAxisGroup.selectAll('text')
        .style('font-size', '20px')
        .style('font-family', 'system-ui, sans-serif')
        .attr('transform', 'rotate(-15)')
        .attr('dx', '-0.5em')
        .attr('dy', '0.5em')
        .style('text-anchor', 'end');
}

function renderFiles(commitsData) {
    const lines = commitsData.flatMap(d => d.lines);
    
    if (!lines || lines.length === 0) {
        d3.select('#files').html('<div>No files to display</div>');
        return;
    }
    
    // Define consistent colors for file types
    const typeColors = {
        'js': '#4c72b0',      // Blue for JavaScript
        'css': '#dd8452',     // Orange for CSS
        'html': '#55a868',    // Green for HTML
        'json': '#c44e52',    // Red for JSON
        'svg': '#8172b2',     // Purple for SVG
        'md': '#ccb974',      // Yellow for Markdown
        'unknown': '#9467bd'  // Light purple for other
    };
    
    let files = d3.groups(lines, d => d.file)
        .map(([name, fileLines]) => ({ 
            name: name, 
            lines: fileLines, 
            count: fileLines.length, 
            type: name ? name.split('.').pop() : 'unknown'
        }))
        .sort((a, b) => b.count - a.count);
    
    const container = d3.select('#files').html('');
    
    files.forEach(file => {
        const div = container.append('div');
        div.append('dt').html(`<code>${file.name}</code> <small>(${file.count} lines)</small>`);
        const dd = div.append('dd');
        
        // Get color based on file type
        const dotColor = typeColors[file.type] || typeColors['unknown'];
        
        file.lines.forEach(line => {
            dd.append('div')
                .attr('class', 'loc')
                .style('background', dotColor)
                .attr('title', `${file.name} line ${line.line}`);
        });
    });
}

function renderLegend() {
    const typeColors = {
        'js': { color: '#4c72b0', name: 'JavaScript' },
        'css': { color: '#dd8452', name: 'CSS' },
        'html': { color: '#55a868', name: 'HTML' },
        'json': { color: '#c44e52', name: 'JSON' },
        'svg': { color: '#8172b2', name: 'SVG' },
        'md': { color: '#ccb974', name: 'Markdown' },
        'unknown': { color: '#9467bd', name: 'Other' }
    };
    
    const legendContainer = d3.select('#legend-items');
    legendContainer.html('');
    
    Object.entries(typeColors).forEach(([key, value]) => {
        legendContainer.append('div')
            .attr('class', 'legend-item')
            .html(`
                <span class="legend-swatch" style="background: ${value.color}"></span>
                <span>${value.name}</span>
            `);
    });
}

// Call renderLegend() after loading data
renderLegend();

// Generate stories based on filtered commits
function generateStories(filteredCommitsData) {
    const container = d3.select('#scatter-story').html('');
    
    filteredCommitsData.forEach((commit, i) => {
        const dateStr = commit.datetime.toLocaleDateString('en', { month: 'short', day: 'numeric', year: 'numeric' });
        const timeStr = commit.datetime.toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' });
        
        container.append('div')
            .attr('class', 'step')
            .attr('data-commit-id', commit.id)
            .html(`
                <div class="step-content">
                    <p><strong>${dateStr} at ${timeStr}</strong></p>
                    <p>Made <a href="${commit.url}" target="_blank">commit ${i + 1}</a></p>
                    <p>Edited ${commit.totalLines} lines across ${new Set(commit.lines.map(l => l.file)).size} files</p>
                </div>
            `);
    });
}

function onTimeSliderChange() {
    const progress = Number(document.getElementById('commit-progress').value);
    const maxTime = timeScale.invert(progress);
    document.getElementById('commit-time').textContent = maxTime.toLocaleString('en', { dateStyle: 'long', timeStyle: 'short' });
    
    filteredCommits = commits.filter(d => d.datetime <= maxTime);
    updateScatterPlot(filteredCommits);
    renderFiles(filteredCommits);
    renderStats(filteredCommits);
    generateStories(filteredCommits);
}

function setupScrollama() {
    if (scroller) {
        scroller.destroy();
    }
    scroller = scrollama();
    scroller.setup({
        container: '#scrolly-1',
        step: '.step',
        offset: 0.5
    }).onStepEnter(response => {
        const commitId = response.element.getAttribute('data-commit-id');
        const commit = filteredCommits.find(c => c.id === commitId);
        if (commit) {
            const progress = timeScale(commit.datetime);
            document.getElementById('commit-progress').value = progress;
            onTimeSliderChange();
        }
    });
}

// Watch for theme changes
function setupThemeObserver() {
    const observer = new MutationObserver(() => {
        renderStats(filteredCommits);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

// Initialize
const data = await loadData();
commits = processCommits(data);

const dateExtent = d3.extent(commits, d => d.datetime);
timeScale = d3.scaleTime()
    .domain(dateExtent)
    .range([0, 100]);

const initialMaxTime = timeScale.invert(100);
filteredCommits = commits.filter(d => d.datetime <= initialMaxTime);

renderStats(filteredCommits);
renderScatterPlot(filteredCommits);
renderFiles(filteredCommits);
generateStories(filteredCommits);

document.getElementById('commit-progress').addEventListener('input', onTimeSliderChange);
onTimeSliderChange();

setupScrollama();
setupThemeObserver();