import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'

const supabaseUrl = 'https://mdspsmxwitbczvfwzpiu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kc3BzbXh3aXRiY3p2Znd6cGl1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMjMwNDUsImV4cCI6MjA2Mjg5OTA0NX0.2sb9ReFc7T2sqjcTGrzPK_til3XcZVNBgcb4UzGegM4'
const supabase = createClient(supabaseUrl, supabaseKey)

let last_month = null;
let last_year = null;
const yearly_data = new Map();
const monthly_data = new Map();
let years = ["2025"];
let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function handleButtonClick(event) {
    const target = event.target;

    if (target.classList.contains("year") || target.classList.contains("month")) {
        if (target.classList.contains("year")) {
            if (last_year !== null) {
                last_year.classList.remove("clicked");
            }
            target.classList.add("clicked");
            last_year = target;
        } else {
            if (last_month !== null) {
                last_month.classList.remove("clicked");
            }
            target.classList.add("clicked");
            last_month = target;
        }
    }

    if (last_year != null && last_month != null) {
        show_data();
    }
}

async function import_data() {
    for (let year_idx = 0; year_idx < years.length; year_idx++) {

        if (!yearly_data.has(years[year_idx])) {
            yearly_data.set(`${years[year_idx]}`, new Map());
        }

        let yearly_flag = true;
        let yearly_total_working_hours = 0.0;
        let yearly_total_basic_salary = 0.0;
        let yearly_total_overtime_pay = 0.0;
        let yearly_total_total_salary = 0.0;

        for (let month_idx = 0; month_idx < 12; month_idx++) {

            let monthly_flag = true;
            let monthly_total_working_hours = 0.0;
            let monthly_total_basic_salary = 0.0;
            let monthly_total_overtime_pay = 0.0;
            let monthly_total_total_salary = 0.0;

            const { data, error } = await supabase
                .from(`salary${years[year_idx]}${months[month_idx].toLowerCase()}`)
                .select('*')

            if (error) {
                console.error('Error fetching data:', error);
                continue;
            }

            if (!monthly_data.has(`${years[year_idx]}_${months[month_idx]}`)) {
                monthly_data.set(`${years[year_idx]}_${months[month_idx]}`, new Map());
            }

            if (data) {
                for (let d = 0; d < data.length; d++) {

                    const line = data[d];

                    const time = line.dateNumber;
                    const classValue = line.class;
                    const hourlyWage = line.hourlyWage;
                    const workingHours = line.workingHours;
                    const basicSalary = line.basicSalary;
                    const overtimePay = line.overtimePay;
                    const totalSalary = line.totalSalary;
                    const remark = line.remark;
                    const verify = line.verify;

                    monthly_total_working_hours += workingHours;
                    monthly_total_basic_salary += basicSalary;
                    monthly_total_overtime_pay += overtimePay;
                    monthly_total_total_salary += totalSalary;
                    monthly_flag &= verify;

                    monthly_data.get(`${years[year_idx]}_${months[month_idx]}`).set(time, [classValue, workingHours, hourlyWage, basicSalary, overtimePay, totalSalary, remark, verify]);
                }
            }


            monthly_data.get(`${years[year_idx]}_${months[month_idx]}`).set("total", ['', monthly_total_working_hours, '', monthly_total_basic_salary, monthly_total_overtime_pay, monthly_total_total_salary, '', monthly_flag]);
            yearly_data.get(years[year_idx]).set(months[month_idx], [monthly_total_working_hours, monthly_total_basic_salary, monthly_total_overtime_pay, monthly_total_total_salary, monthly_flag]);

            yearly_total_working_hours += monthly_total_working_hours;
            yearly_total_basic_salary += monthly_total_basic_salary;
            yearly_total_overtime_pay += monthly_total_overtime_pay;
            yearly_total_total_salary += monthly_total_total_salary;
            yearly_flag &= monthly_flag;
        }
        yearly_data.get(years[year_idx]).set("total", [yearly_total_working_hours, yearly_total_basic_salary, yearly_total_overtime_pay, yearly_total_total_salary, yearly_flag]);
    }
}

function show_data() {
    const data_table = document.getElementById("show");
    const table_head = data_table.querySelector("thead");
    const table_body = data_table.querySelector("tbody");
    let htmlContent = '';

    if (last_month.textContent == "Annual") {
        const show_key = last_year.textContent;
        if (!yearly_data.has(show_key)) {
            table_head.innerHTML = '';
            table_body.innerHTML = "<div>找不到該年份的資料</div>";
            return;
        }

        table_head.innerHTML = "<tr><th>time</th><th>Working hours</th><th>Basic salary</th><th>Overtime pay</th><th>Total salary</th></tr>";
        for (const [key, value] of yearly_data.get(show_key)) {
            let tmp = "<tr>" + `
                        <td>${last_year.textContent} ${key}</td>
                        <td>${value[0]}</td>
                        <td>${value[1]}</td>
                        <td>${value[2]}</td>
                        <td>${value[3]}</td>
                    ` + "</tr>\n";
            if (value[4]) {
                tmp.replace("<td>", "<td><b>");
                tmp.replace("</td>", "</b></td>");
            }
            htmlContent += tmp;
        }
    } else {
        const show_key = `${last_year.textContent}_${last_month.textContent}`;
        if (!monthly_data.has(show_key)) {
            table_head.innerHTML = '';
            table_body.innerHTML = "<div>找不到該月份的資料</div>";
            return;
        }

        table_head.innerHTML = "<tr><th>time</th><th>Class</th><th>Working hours</th><th>Hourly wage</th><th>Basic salary</th><th>Overtime pay</th><th>Total salary</th><th>Remark</th></tr>";
        for (const [key, value] of monthly_data.get(show_key)) {
            let tmp = "<tr>" + `
                        <td>${last_month.textContent} ${key}</td>
                        <td>${value[0]}</td>
                        <td>${value[1]}</td>
                        <td>${value[2]}</td>
                        <td>${value[3]}</td>
                        <td>${value[4]}</td>
                        <td>${value[5]}</td>
                        <td>${value[6]}</td>
                    ` + "</tr>\n";
            if (value[7]) {
                tmp.replace("<td>", "<td><b>");
                tmp.replace("</td>", "</b></td>");
            }
            htmlContent += tmp;
        }
    }

    table_body.innerHTML = htmlContent;
}

document.addEventListener('DOMContentLoaded', () => {
    import_data();
    document.getElementById("selection_year").addEventListener("click", handleButtonClick);
    document.getElementById("selection_month").addEventListener("click", handleButtonClick);
});
