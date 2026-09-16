document.addEventListener("DOMContentLoaded", async () => {
  const latestDateElement = document.getElementById("latest-date");
  const startDateInput = document.getElementById("start-date");
  const endDateInput = document.getElementById("end-date");
  const channelFilter = document.getElementById("channel-filter");
  const marketButtons = document.querySelectorAll("[data-market]");
  const viewLabel = document.getElementById("view-label");
  const printButton = document.getElementById("print-report");
  const trendMetric = document.getElementById("trend-metric");
  const performanceCanvas = document.getElementById("performance-chart");
  const ageCanvas = document.getElementById("age-chart");
  const genderCanvas = document.getElementById("gender-chart");
  const ageTableBody = document.getElementById("age-table-body");
  const genderTableBody = document.getElementById("gender-table-body");
  const legendCombined = document.getElementById("legend-combined");
  const legendOmaha = document.getElementById("legend-omaha");
  const legendKC = document.getElementById("legend-kc");

  let campaignRows = [];
  let ageRows = [];
  let genderRows = [];
  let selectedMarket = "all";
  let selectedChannel = "all";
  let performanceChart = null;
  let ageChart = null;
  let genderChart = null;

  const wholeNumberFormatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0
  });

  const conversionFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });

  const percentFormatter = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  });

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });

  const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  });

  const ageOrder = [
    "18-20",
    "21-24",
    "25-29",
    "30-34",
    "35-39",
    "40-44",
    "45-49",
    "50-54",
    "55-64",
    "65+",
    "Unknown"
  ];

  const ageColors = [
    "#003f6b",
    "#00588f",
    "#0074bc",
    "#028fc8",
    "#00aeea",
    "#42b9d8",
    "#73c7d8",
    "#9bd4dc",
    "#4f6f8f",
    "#7b8da1",
    "#98a2b3"
  ];

  const genderColors = {
    Female: "#0074bc",
    Male: "#00aeea",
    Unknown: "#98a2b3"
  };

  function getChannel(row) {
    const campaign = REPORT_CONFIG.campaigns[String(row.campaign_id)];
    return campaign ? campaign.channel : null;
  }

  function getMarketLabel(market) {
    if (market === REPORT_CONFIG.markets.omaha) {
      return "Omaha";
    }

    if (market === REPORT_CONFIG.markets.kansasCity) {
      return "Kansas City";
    }

    return "Both Markets";
  }

  function formatDisplayDate(dateString) {
    if (!dateString) {
      return "—";
    }

    return dateFormatter.format(new Date(dateString + "T00:00:00Z"));
  }

  function formatShortDate(dateString) {
    return shortDateFormatter.format(new Date(dateString + "T00:00:00Z"));
  }

  function getRowsForDateAndChannel(rows) {
    const startDate = startDateInput.value;
    const endDate = endDateInput.value;

    return rows.filter(row => {
      if (startDate && row.date < startDate) {
        return false;
      }

      if (endDate && row.date > endDate) {
        return false;
      }

      if (
        selectedChannel !== "all" &&
        getChannel(row) !== selectedChannel
      ) {
        return false;
      }

      return true;
    });
  }

  function getFilteredRows(rows) {
    return getRowsForDateAndChannel(rows).filter(row => {
      if (selectedMarket === "all") {
        return true;
      }

      return String(row.journey_id) === String(selectedMarket);
    });
  }

  function aggregateCampaignRows(rows) {
    const totals = rows.reduce(
      (result, row) => {
        result.impressions += Number(row.impressions || 0);
        result.clicks += Number(row.clicks || 0);
        result.conversions += Number(row.conversions || 0);
        return result;
      },
      {
        impressions: 0,
        clicks: 0,
        conversions: 0
      }
    );

    totals.ctr =
      totals.impressions > 0
        ? (totals.clicks / totals.impressions) * 100
        : 0;

    return totals;
  }

  function updateExecutiveOverview() {
    const totals = aggregateCampaignRows(getFilteredRows(campaignRows));

    document.getElementById("kpi-impressions").textContent =
      wholeNumberFormatter.format(totals.impressions);

    document.getElementById("kpi-clicks").textContent =
      wholeNumberFormatter.format(totals.clicks);

    document.getElementById("kpi-conversions").textContent =
      conversionFormatter.format(totals.conversions);

    document.getElementById("kpi-ctr").textContent =
      percentFormatter.format(totals.ctr) + "%";

    viewLabel.textContent = getMarketLabel(selectedMarket);
  }

  function updateMarketComparison() {
    const rows = getRowsForDateAndChannel(campaignRows);

    const omaha = aggregateCampaignRows(
      rows.filter(
        row =>
          String(row.journey_id) ===
          String(REPORT_CONFIG.markets.omaha)
      )
    );

    const kansasCity = aggregateCampaignRows(
      rows.filter(
        row =>
          String(row.journey_id) ===
          String(REPORT_CONFIG.markets.kansasCity)
      )
    );

    document.getElementById("omaha-impressions").textContent =
      wholeNumberFormatter.format(omaha.impressions);

    document.getElementById("kc-impressions").textContent =
      wholeNumberFormatter.format(kansasCity.impressions);
  }

  function groupDaily(rows, metric) {
    return rows.reduce((daily, row) => {
      if (!daily[row.date]) {
        daily[row.date] = 0;
      }

      daily[row.date] += Number(row[metric] || 0);
      return daily;
    }, {});
  }

  function updateTrendLegend() {
    legendCombined.classList.remove("is-hidden");
    legendOmaha.classList.remove("is-hidden");
    legendKC.classList.remove("is-hidden");

    if (selectedMarket === REPORT_CONFIG.markets.omaha) {
      legendCombined.classList.add("is-hidden");
      legendKC.classList.add("is-hidden");
    }

    if (selectedMarket === REPORT_CONFIG.markets.kansasCity) {
      legendCombined.classList.add("is-hidden");
      legendOmaha.classList.add("is-hidden");
    }
  }

  function lineDataset(label, data, color, width) {
    return {
      label,
      data,
      borderColor: color,
      backgroundColor: color,
      borderWidth: width,
      tension: 0.2,
      pointRadius: 0,
      pointHoverRadius: 3
    };
  }

  function updatePerformanceChart() {
    if (!performanceCanvas || typeof Chart === "undefined") {
      return;
    }

    const metric = trendMetric.value;
    const dateAndChannelRows = getRowsForDateAndChannel(campaignRows);
    const selectedRows =
      selectedMarket === "all"
        ? dateAndChannelRows
        : dateAndChannelRows.filter(
            row =>
              String(row.journey_id) === String(selectedMarket)
          );

    const omahaRows = dateAndChannelRows.filter(
      row =>
        String(row.journey_id) ===
        String(REPORT_CONFIG.markets.omaha)
    );

    const kcRows = dateAndChannelRows.filter(
      row =>
        String(row.journey_id) ===
        String(REPORT_CONFIG.markets.kansasCity)
    );

    const combinedDaily = groupDaily(dateAndChannelRows, metric);
    const omahaDaily = groupDaily(omahaRows, metric);
    const kcDaily = groupDaily(kcRows, metric);

    const dates = [
      ...new Set(selectedRows.map(row => row.date))
    ].sort();

    const labels = dates.map(formatShortDate);
    let datasets = [];

    if (selectedMarket === "all") {
      datasets = [
        lineDataset(
          "Combined",
          dates.map(date => combinedDaily[date] || 0),
          "#0066cc",
          2.5
        ),
        lineDataset(
          "Omaha",
          dates.map(date => omahaDaily[date] || 0),
          "#00aeea",
          2
        ),
        lineDataset(
          "Kansas City",
          dates.map(date => kcDaily[date] || 0),
          "#667085",
          2
        )
      ];
    } else if (selectedMarket === REPORT_CONFIG.markets.omaha) {
      datasets = [
        lineDataset(
          "Omaha",
          dates.map(date => omahaDaily[date] || 0),
          "#00aeea",
          2.5
        )
      ];
    } else {
      datasets = [
        lineDataset(
          "Kansas City",
          dates.map(date => kcDaily[date] || 0),
          "#667085",
          2.5
        )
      ];
    }

    if (performanceChart) {
      performanceChart.destroy();
    }

    performanceChart = new Chart(performanceCanvas, {
      type: "line",
      data: {
        labels,
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false
        },
        layout: {
          padding: {
            top: 2,
            right: 4,
            bottom: 0,
            left: 0
          }
        },
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            callbacks: {
              label(context) {
                const value = Number(context.raw || 0);
                return (
                  context.dataset.label +
                  ": " +
                  wholeNumberFormatter.format(value)
                );
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            border: {
              display: false
            },
            grid: {
              color: "#e9edf2"
            },
            ticks: {
              color: "#738096",
              font: {
                size: 11
              },
              padding: 6,
              maxTicksLimit: 5
            }
          },
          x: {
            border: {
              display: false
            },
            grid: {
              display: false
            },
            ticks: {
              color: "#738096",
              font: {
                size: 11
              },
              maxTicksLimit: 10,
              maxRotation: 0,
              padding: 6
            }
          }
        }
      }
    });

    updateTrendLegend();
  }

  function aggregateDimension(rows, dimensionField) {
    const groups = new Map();

    rows.forEach(row => {
      const dimension = row[dimensionField];

      if (
        dimension === null ||
        dimension === undefined ||
        dimension === ""
      ) {
        return;
      }

      if (!groups.has(dimension)) {
        groups.set(dimension, {
          dimension,
          views: 0,
          clicks: 0,
          conversions: 0
        });
      }

      const group = groups.get(dimension);
      group.views += Number(row.views || 0);
      group.clicks += Number(row.clicks || 0);
      group.conversions += Number(row.conversions || 0);
    });

    return [...groups.values()];
  }

  function sortAgeGroups(groups) {
    return groups.sort((a, b) => {
      const aIndex = ageOrder.indexOf(a.dimension);
      const bIndex = ageOrder.indexOf(b.dimension);
      const safeA = aIndex === -1 ? ageOrder.length : aIndex;
      const safeB = bIndex === -1 ? ageOrder.length : bIndex;

      if (safeA !== safeB) {
        return safeA - safeB;
      }

      return String(a.dimension).localeCompare(String(b.dimension));
    });
  }

  function sortGenderGroups(groups) {
    const order = ["Female", "Male", "Unknown"];

    return groups.sort((a, b) => {
      const aIndex = order.indexOf(a.dimension);
      const bIndex = order.indexOf(b.dimension);
      const safeA = aIndex === -1 ? order.length : aIndex;
      const safeB = bIndex === -1 ? order.length : bIndex;
      return safeA - safeB;
    });
  }

  function renderAudienceTable(tableBody, groups) {
    tableBody.replaceChildren();

    if (!groups.length) {
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.colSpan = 4;
      cell.className = "empty-row";
      cell.textContent = "No audience data for this selection";
      row.appendChild(cell);
      tableBody.appendChild(row);
      return;
    }

    groups.forEach(group => {
      const row = document.createElement("tr");

      if (group.dimension === "Unknown") {
        row.classList.add("unknown-row");
      }

      const values = [
        group.dimension,
        wholeNumberFormatter.format(group.views),
        wholeNumberFormatter.format(group.clicks),
        conversionFormatter.format(group.conversions)
      ];

      values.forEach(value => {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.appendChild(cell);
      });

      tableBody.appendChild(row);
    });
  }

  function renderDonutChart(
    currentChart,
    canvas,
    groups,
    colors
  ) {
    if (!canvas || typeof Chart === "undefined") {
      return currentChart;
    }

    if (currentChart) {
      currentChart.destroy();
    }

    const values = groups.map(group => group.views);
    const total = values.reduce((sum, value) => sum + value, 0);

    return new Chart(canvas, {
      type: "doughnut",
      data: {
        labels: groups.map(group => group.dimension),
        datasets: [
          {
            data: values,
            backgroundColor: colors,
            borderColor: "#ffffff",
            borderWidth: 2,
            hoverOffset: 4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "60%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              usePointStyle: true,
              pointStyle: "circle",
              boxWidth: 8,
              boxHeight: 8,
              padding: 12,
              color: "#526173",
              font: {
                size: 10
              }
            }
          },
          tooltip: {
            callbacks: {
              label(context) {
                const value = Number(context.raw || 0);
                const share =
                  total > 0 ? (value / total) * 100 : 0;

                return (
                  context.label +
                  ": " +
                  wholeNumberFormatter.format(value) +
                  " (" +
                  percentFormatter.format(share) +
                  "%)"
                );
              }
            }
          }
        }
      }
    });
  }

  function updateAudienceSection() {
    const ageGroups = sortAgeGroups(
      aggregateDimension(
        getFilteredRows(ageRows),
        "age_range"
      )
    );

    const genderGroups = sortGenderGroups(
      aggregateDimension(
        getFilteredRows(genderRows),
        "gender"
      )
    );

    renderAudienceTable(ageTableBody, ageGroups);
    renderAudienceTable(genderTableBody, genderGroups);

    const colorsForAge = ageGroups.map((group, index) =>
      group.dimension === "Unknown"
        ? "#98a2b3"
        : ageColors[index % (ageColors.length - 1)]
    );

    const colorsForGender = genderGroups.map(
      group => genderColors[group.dimension] || "#4f6f8f"
    );

    ageChart = renderDonutChart(
      ageChart,
      ageCanvas,
      ageGroups,
      colorsForAge
    );

    genderChart = renderDonutChart(
      genderChart,
      genderCanvas,
      genderGroups,
      colorsForGender
    );
  }

  function updateDashboard() {
    updateExecutiveOverview();
    updateMarketComparison();
    updatePerformanceChart();
    updateAudienceSection();
  }

  marketButtons.forEach(button => {
    button.addEventListener("click", () => {
      selectedMarket = button.dataset.market;

      marketButtons.forEach(otherButton => {
        otherButton.classList.remove("active");
        otherButton.setAttribute("aria-pressed", "false");
      });

      button.classList.add("active");
      button.setAttribute("aria-pressed", "true");
      updateDashboard();
    });
  });

  channelFilter.addEventListener("change", () => {
    selectedChannel = channelFilter.value;
    updateDashboard();
  });

  startDateInput.addEventListener("change", updateDashboard);
  endDateInput.addEventListener("change", updateDashboard);
  trendMetric.addEventListener("change", updatePerformanceChart);

  printButton.addEventListener("click", () => {
    window.print();
  });

  window.addEventListener("beforeprint", () => {
    [performanceChart, ageChart, genderChart].forEach(chart => {
      if (chart) {
        chart.resize();
      }
    });
  });

  async function loadReportData() {
    try {
      latestDateElement.textContent = "Loading...";

      const response = await fetch(REPORT_CONFIG.apiUrl, {
        method: "GET",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("API returned " + response.status);
      }

      const data = await response.json();

      if (!Array.isArray(data.campaign_daily)) {
        throw new Error("campaign_daily missing");
      }

      campaignRows = data.campaign_daily;
      ageRows = Array.isArray(data.audience?.age_daily)
        ? data.audience.age_daily
        : [];
      genderRows = Array.isArray(data.audience?.gender_daily)
        ? data.audience.gender_daily
        : [];

      const availableDates = [
        ...new Set(
          campaignRows
            .map(row => row.date)
            .filter(Boolean)
        )
      ].sort();

      if (!availableDates.length) {
        throw new Error("campaign_daily is empty");
      }

      const earliestDate = availableDates[0];
      const latestDate =
        data.freshness?.latest_date ||
        availableDates[availableDates.length - 1];

      startDateInput.min = earliestDate;
      startDateInput.max = latestDate;
      startDateInput.value = earliestDate;

      endDateInput.min = earliestDate;
      endDateInput.max = latestDate;
      endDateInput.value = latestDate;

      latestDateElement.textContent =
        formatDisplayDate(latestDate);

      updateDashboard();
    } catch (error) {
      console.error(error);
      latestDateElement.textContent = "Data unavailable";
    }
  }

  marketButtons.forEach(button => {
    button.setAttribute(
      "aria-pressed",
      button.classList.contains("active") ? "true" : "false"
    );
  });

  await loadReportData();
});
