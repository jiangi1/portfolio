import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

async function loadData() {
  const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));
  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/jiangi1/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };
      Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
      });
      return ret;
    });
}

function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
  dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
  dl.append('dd').text(data.length);
  
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);
  
  const fileCount = d3.group(data, d => d.file).size;
  dl.append('dt').text('Number of files');
  dl.append('dd').text(fileCount);
  
  const avgFileLength = d3.mean(
    Array.from(d3.group(data, d => d.file).values()),
    lines => d3.max(lines, d => d.line)
  );
  dl.append('dt').text('Average file length');
  dl.append('dd').text(Math.round(avgFileLength));
  
  const deepestLine = d3.max(data, d => d.depth);
  dl.append('dt').text('Maximum depth');
  dl.append('dd').text(deepestLine);
  
  const longestLine = d3.max(data, d => d.length);
  dl.append('dt').text('Longest line (chars)');
  dl.append('dd').text(longestLine);
}

function renderTooltipContent(commit) {
  const tooltip = document.getElementById('commit-tooltip');
  if (!commit || Object.keys(commit).length === 0) return;
  
  tooltip.innerHTML = `
    <dt>Commit</dt>
    <dd><a href="${commit.url}" target="_blank">${commit.id.slice(0, 7)}</a></dd>
    <dt>Date</dt>
    <dd>${commit.datetime?.toLocaleString('en', { dateStyle: 'full' })}</dd>
    <dt>Time</dt>
    <dd>${commit.datetime?.toLocaleString('en', { timeStyle: 'short' })}</dd>
    <dt>Author</dt>
    <dd>${commit.author}</dd>
    <dt>Lines edited</dt>
    <dd><strong>${commit.totalLines}</strong> lines</dd>
  `;
}

function updateTooltipVisibility(isVisible) {
  const tooltip = document.getElementById('commit-tooltip');
  if (tooltip) {
    tooltip.hidden = !isVisible;
  }
}

function updateTooltipPosition(event) {
  const tooltip = document.getElementById('commit-tooltip');
  if (tooltip) {
    tooltip.style.left = `${event.clientX + 15}px`;
    tooltip.style.top = `${event.clientY + 15}px`;
  }
}

function renderSelectionCount(selectedCommits) {
  const countElement = document.querySelector('#selection-count');
  if (selectedCommits === null) {
    countElement.textContent = 'All commits (no filter applied)';
  } else if (selectedCommits.length === 0) {
    countElement.textContent = 'No commits selected';
  } else {
    countElement.textContent = `${selectedCommits.length} commit${selectedCommits.length === 1 ? '' : 's'} selected`;
  }
}

function renderLanguageBreakdown(selectedCommits, allCommits) {
  const container = document.getElementById('language-breakdown');
  
  const commitsToAnalyze = selectedCommits === null ? allCommits : selectedCommits;
  
  if (!commitsToAnalyze || commitsToAnalyze.length === 0) {
    container.innerHTML = '<dt>No commits selected</dt><dd></dd>';
    return;
  }
  
  const lines = commitsToAnalyze.flatMap(d => d.lines);
  
  if (lines.length === 0) {
    container.innerHTML = '<dt>No lines found</dt><dd></dd>';
    return;
  }
  
  const breakdown = d3.rollup(
    lines,
    v => v.length,
    d => d.type
  );
  
  const sorted = Array.from(breakdown).sort((a, b) => b[1] - a[1]);
  const total = lines.length;
  
  container.innerHTML = '';
  for (const [language, count] of sorted) {
    const proportion = count / total;
    const formatted = d3.format('.1~%')(proportion);
    container.innerHTML += `
      <dt>${language}</dt>
      <dd>${count} lines (${formatted})</dd>
    `;
  }
}

function brushSelector(commits, xScale, yScale) {
  const brush = d3.brush();
  
  brush.on('start brush end', (event) => {
    const selection = event.selection;
    
    if (!selection) {
      d3.selectAll('circle').classed('selected', false);
      renderSelectionCount(null);
      renderLanguageBreakdown(null, commits);
      return;
    }
    
    const [[x0, y0], [x1, y1]] = selection;
    
    const selectedCommits = commits.filter(d => {
      const cx = xScale(d.datetime);
      const cy = yScale(d.hourFrac);
      return cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1;
    });
    
    d3.selectAll('circle').attr('class', d => 
      selectedCommits.includes(d) ? 'selected' : ''
    );
    
    renderSelectionCount(selectedCommits);
    renderLanguageBreakdown(selectedCommits, commits);
  });
  
  return brush;
}

function renderScatterPlot(commits) {
  const width = 1000;
  const height = 600;
  const margin = { top: 20, right: 30, bottom: 40, left: 60 };
  
  d3.select('#chart').selectAll('svg').remove();
  
  const svg = d3.select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');
  
  const xScale = d3.scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([margin.left, width - margin.right])
    .nice();
  
  const yScale = d3.scaleLinear()
    .domain([0, 24])
    .range([height - margin.bottom, margin.top]);
  
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
  const rScale = d3.scaleSqrt()
    .domain([minLines, maxLines])
    .range([2, 30]);
  
  const gridlines = svg.append('g')
    .attr('class', 'gridlines');
  
  gridlines.call(d3.axisLeft(yScale)
    .tickValues([0, 4, 8, 12, 16, 20, 24])
    .tickFormat('')
    .tickSize(-(width - margin.left - margin.right)));
  
  svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(d3.axisBottom(xScale));
  
  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(d3.axisLeft(yScale).tickFormat(d => {
      const hour = d % 24;
      return `${hour.toString().padStart(2, '0')}:00`;
    }));
  
  // Add brush FIRST
  const brush = brushSelector(commits, xScale, yScale);
  svg.call(brush);
  
  // Then add dots so they are on top of brush overlay
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  
  svg.selectAll('circle')
    .data(sortedCommits)
    .join('circle')
    .attr('cx', d => xScale(d.datetime))
    .attr('cy', d => yScale(d.hourFrac))
    .attr('r', d => rScale(d.totalLines))
    .attr('fill', 'steelblue')
    .attr('opacity', 0.7)
    .style('cursor', 'pointer')
    .on('mouseenter', (event, commit) => {
      d3.select(event.currentTarget)
        .attr('fill', '#ff6b6b')
        .attr('opacity', 1);
      renderTooltipContent(commit);
      updateTooltipVisibility(true);
      updateTooltipPosition(event);
    })
    .on('mousemove', (event) => {
      updateTooltipPosition(event);
    })
    .on('mouseleave', (event) => {
      d3.select(event.currentTarget)
        .attr('fill', 'steelblue')
        .attr('opacity', 0.7);
      updateTooltipVisibility(false);
    });
  
  // Raise dots above brush overlay
  svg.selectAll('circle').raise();
}

const data = await loadData();
const commits = processCommits(data);

renderCommitInfo(data, commits);
renderScatterPlot(commits);