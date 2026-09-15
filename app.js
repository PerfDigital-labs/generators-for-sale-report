document.addEventListener(
  "DOMContentLoaded",
  async () => {


    /* ELEMENTS */

    const latestDateElement =
      document.getElementById("latest-date");

    const startDateInput =
      document.getElementById("start-date");

    const endDateInput =
      document.getElementById("end-date");

    const channelFilter =
      document.getElementById("channel-filter");

    const marketButtons =
      document.querySelectorAll("[data-market]");

    const viewLabel =
      document.getElementById("view-label");

    const printButton =
      document.getElementById("print-report");

    const trendMetric =
      document.getElementById("trend-metric");

    const performanceCanvas =
      document.getElementById("performance-chart");

    const legendCombined =
      document.getElementById("legend-combined");

    const legendOmaha =
      document.getElementById("legend-omaha");

    const legendKC =
      document.getElementById("legend-kc");


    /* STATE */

    let campaignRows = [];

    let selectedMarket =
      "all";

    let selectedChannel =
      "all";

    let performanceChart =
      null;


    /* FORMATTERS */

    const wholeNumberFormatter =
      new Intl.NumberFormat(
        "en-US",
        {
          maximumFractionDigits: 0
        }
      );


    const currencyFormatter =
      new Intl.NumberFormat(
        "en-US",
        {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      );


    const percentFormatter =
      new Intl.NumberFormat(
        "en-US",
        {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }
      );


    const dateFormatter =
      new Intl.DateTimeFormat(
        "en-US",
        {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC"
        }
      );


    const shortDateFormatter =
      new Intl.DateTimeFormat(
        "en-US",
        {
          month: "short",
          day: "numeric",
          timeZone: "UTC"
        }
      );


    /* HELPERS */

    function getChannel(row) {

      const campaign =
        REPORT_CONFIG.campaigns[
          String(row.campaign_id)
        ];

      return campaign
        ? campaign.channel
        : null;

    }


    function getMarketLabel(market) {

      if (market === "53305") {
        return "Omaha";
      }

      if (market === "53313") {
        return "Kansas City";
      }

      return "Both Markets";

    }


    function formatDisplayDate(
      dateString
    ) {

      if (!dateString) {
        return "—";
      }

      return dateFormatter.format(
        new Date(
          `${dateString}T00:00:00Z`
        )
      );

    }


    function formatShortDate(
      dateString
    ) {

      return shortDateFormatter.format(
        new Date(
          `${dateString}T00:00:00Z`
        )
      );

    }


    /* FILTERS */

    function getRowsForDateAndChannel() {

      const startDate =
        startDateInput.value;

      const endDate =
        endDateInput.value;


      return campaignRows.filter(
        row => {

          if (
            startDate &&
            row.date < startDate
          ) {
            return false;
          }


          if (
            endDate &&
            row.date > endDate
          ) {
            return false;
          }


          if (
            selectedChannel !== "all" &&
            getChannel(row) !==
            selectedChannel
          ) {
            return false;
          }


          return true;

        }
      );

    }


    function getFilteredRows() {

      return getRowsForDateAndChannel()
        .filter(
          row => {

            if (
              selectedMarket === "all"
            ) {
              return true;
            }

            return (
              String(row.journey_id) ===
              String(selectedMarket)
            );

          }
        );

    }


    /* AGGREGATE */

    function aggregateRows(rows) {

      const totals =
        rows.reduce(
          (result, row) => {

            result.impressions +=
              Number(
                row.impressions || 0
              );

            result.clicks +=
              Number(
                row.clicks || 0
              );

            result.spend +=
              Number(
                row.spend || 0
              );

            result.conversions +=
              Number(
                row.conversions || 0
              );

            return result;

          },
          {
            impressions: 0,
            clicks: 0,
            spend: 0,
            conversions: 0
          }
        );


      totals.ctr =
        totals.impressions > 0
          ? (
              totals.clicks /
              totals.impressions
            ) * 100
          : 0;


      totals.cpm =
        totals.impressions > 0
          ? (
              totals.spend /
              totals.impressions
            ) * 1000
          : 0;


      return totals;

    }


    /* KPIS */

    function updateExecutiveOverview() {

      const totals =
        aggregateRows(
          getFilteredRows()
        );


      document.getElementById(
        "kpi-impressions"
      ).textContent =
        wholeNumberFormatter.format(
          totals.impressions
        );


      document.getElementById(
        "kpi-clicks"
      ).textContent =
        wholeNumberFormatter.format(
          totals.clicks
        );


      document.getElementById(
        "kpi-spend"
      ).textContent =
        currencyFormatter.format(
          totals.spend
        );


      document.getElementById(
        "kpi-conversions"
      ).textContent =
        wholeNumberFormatter.format(
          totals.conversions
        );


      document.getElementById(
        "kpi-ctr"
      ).textContent =
        `${percentFormatter.format(
          totals.ctr
        )}%`;


      document.getElementById(
        "kpi-cpm"
      ).textContent =
        currencyFormatter.format(
          totals.cpm
        );


      viewLabel.textContent =
        getMarketLabel(
          selectedMarket
        );

    }


    /* MARKET COMPARISON */

    function updateMarketComparison() {

      const rows =
        getRowsForDateAndChannel();


      const omaha =
        aggregateRows(
          rows.filter(
            row =>
              String(
                row.journey_id
              ) === "53305"
          )
        );


      const kc =
        aggregateRows(
          rows.filter(
            row =>
              String(
                row.journey_id
              ) === "53313"
          )
        );


      document.getElementById(
        "omaha-impressions"
      ).textContent =
        wholeNumberFormatter.format(
          omaha.impressions
        );


      document.getElementById(
        "kc-impressions"
      ).textContent =
        wholeNumberFormatter.format(
          kc.impressions
        );

    }


    /* DAILY DATA */

    function groupDaily(
      rows,
      metric
    ) {

      const daily = {};


      rows.forEach(
        row => {

          if (!daily[row.date]) {
            daily[row.date] = 0;
          }

          daily[row.date] +=
            Number(
              row[metric] || 0
            );

        }
      );


      return daily;

    }


    /* LEGEND */

    function updateTrendLegend() {

      legendCombined.classList.remove(
        "is-hidden"
      );

      legendOmaha.classList.remove(
        "is-hidden"
      );

      legendKC.classList.remove(
        "is-hidden"
      );


      if (
        selectedMarket === "53305"
      ) {

        legendCombined.classList.add(
          "is-hidden"
        );

        legendKC.classList.add(
          "is-hidden"
        );

      }


      if (
        selectedMarket === "53313"
      ) {

        legendCombined.classList.add(
          "is-hidden"
        );

        legendOmaha.classList.add(
          "is-hidden"
        );

      }

    }


    /* CHART */

    function updatePerformanceChart() {

      if (
        !performanceCanvas ||
        typeof Chart === "undefined"
      ) {
        return;
      }


      const metric =
        trendMetric.value;


      const rows =
        getRowsForDateAndChannel();


      const omahaRows =
        rows.filter(
          row =>
            String(
              row.journey_id
            ) === "53305"
        );


      const kcRows =
        rows.filter(
          row =>
            String(
              row.journey_id
            ) === "53313"
        );


      const combinedDaily =
        groupDaily(
          rows,
          metric
        );


      const omahaDaily =
        groupDaily(
          omahaRows,
          metric
        );


      const kcDaily =
        groupDaily(
          kcRows,
          metric
        );


      const dates =
        [
          ...new Set(
            rows.map(
              row => row.date
            )
          )
        ].sort();


      const labels =
        dates.map(
          date =>
            formatShortDate(date)
        );


      let datasets = [];


      if (
        selectedMarket === "all"
      ) {

        datasets = [

          {
            label: "Combined",

            data:
              dates.map(
                date =>
                  combinedDaily[
                    date
                  ] || 0
              ),

            borderColor:
              "#0066cc",

            backgroundColor:
              "#0066cc",

            borderWidth:
              2.5,

            tension:
              0.2,

            pointRadius:
              0,

            pointHoverRadius:
              3
          },


          {
            label: "Omaha",

            data:
              dates.map(
                date =>
                  omahaDaily[
                    date
                  ] || 0
              ),

            borderColor:
              "#00aeea",

            backgroundColor:
              "#00aeea",

            borderWidth:
              2,

            tension:
              0.2,

            pointRadius:
              0,

            pointHoverRadius:
              3
          },


          {
            label:
              "Kansas City",

            data:
              dates.map(
                date =>
                  kcDaily[
                    date
                  ] || 0
              ),

            borderColor:
              "#667085",

            backgroundColor:
              "#667085",

            borderWidth:
              2,

            tension:
              0.2,

            pointRadius:
              0,

            pointHoverRadius:
              3
          }

        ];

      }


      if (
        selectedMarket === "53305"
      ) {

        datasets = [

          {
            label: "Omaha",

            data:
              dates.map(
                date =>
                  omahaDaily[
                    date
                  ] || 0
              ),

            borderColor:
              "#00aeea",

            backgroundColor:
              "#00aeea",

            borderWidth:
              2.5,

            tension:
              0.2,

            pointRadius:
              0,

            pointHoverRadius:
              3
          }

        ];

      }


      if (
        selectedMarket === "53313"
      ) {

        datasets = [

          {
            label:
              "Kansas City",

            data:
              dates.map(
                date =>
                  kcDaily[
                    date
                  ] || 0
              ),

            borderColor:
              "#667085",

            backgroundColor:
              "#667085",

            borderWidth:
              2.5,

            tension:
              0.2,

            pointRadius:
              0,

            pointHoverRadius:
              3
          }

        ];

      }


      if (performanceChart) {
        performanceChart.destroy();
      }


      performanceChart =
        new Chart(
          performanceCanvas,
          {

            type:
              "line",

            data: {
              labels,
              datasets
            },

            options: {

              responsive:
                true,

              maintainAspectRatio:
                false,

              interaction: {
                mode:
                  "index",

                intersect:
                  false
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

                      const value =
                        Number(
                          context.raw || 0
                        );


                      if (
                        metric === "spend"
                      ) {

                        return (
                          `${context.dataset.label}: ` +
                          currencyFormatter.format(
                            value
                          )
                        );

                      }


                      return (
                        `${context.dataset.label}: ` +
                        wholeNumberFormatter.format(
                          value
                        )
                      );

                    }

                  }

                }

              },

              scales: {

                y: {

                  beginAtZero:
                    true,

                  border: {
                    display: false
                  },

                  grid: {
                    color:
                      "#e9edf2"
                  },

                  ticks: {

                    color:
                      "#738096",

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

                    color:
                      "#738096",

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

          }
        );


      updateTrendLegend();

    }


    /* UPDATE */

    function updateDashboard() {

      updateExecutiveOverview();

      updateMarketComparison();

      updatePerformanceChart();

    }


    /* MARKET */

    marketButtons.forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            selectedMarket =
              button.dataset.market;


            marketButtons.forEach(
              otherButton =>
                otherButton
                  .classList
                  .remove("active")
            );


            button.classList.add(
              "active"
            );


            updateDashboard();

          }
        );

      }
    );


    /* CHANNEL */

    channelFilter.addEventListener(
      "change",
      () => {

        selectedChannel =
          channelFilter.value;

        updateDashboard();

      }
    );


    /* DATES */

    startDateInput.addEventListener(
      "change",
      updateDashboard
    );


    endDateInput.addEventListener(
      "change",
      updateDashboard
    );


    /* METRIC */

    trendMetric.addEventListener(
      "change",
      updatePerformanceChart
    );


    /* PRINT */

    printButton.addEventListener(
      "click",
      () => {

        window.print();

      }
    );


    /* LOAD DATA */

    async function loadReportData() {

      try {

        latestDateElement.textContent =
          "Loading...";


        const response =
          await fetch(
            REPORT_CONFIG.apiUrl,
            {
              method:
                "GET",

              cache:
                "no-store"
            }
          );


        if (!response.ok) {

          throw new Error(
            `API returned ${response.status}`
          );

        }


        const data =
          await response.json();


        if (
          !Array.isArray(
            data.campaign_daily
          )
        ) {

          throw new Error(
            "campaign_daily missing"
          );

        }


        campaignRows =
          data.campaign_daily;


        const latestDate =
          data.freshness?.latest_date ||
          campaignRows
            .map(
              row =>
                row.date
            )
            .sort()
            .at(-1);


        startDateInput.min =
          "2026-01-01";

        startDateInput.max =
          latestDate;

        startDateInput.value =
          "2026-01-01";


        endDateInput.min =
          "2026-01-01";

        endDateInput.max =
          latestDate;

        endDateInput.value =
          latestDate;


        latestDateElement.textContent =
          formatDisplayDate(
            latestDate
          );


        updateDashboard();

      }


      catch (error) {

        console.error(error);

        latestDateElement.textContent =
          "Data unavailable";

      }

    }


    await loadReportData();

  }
);
