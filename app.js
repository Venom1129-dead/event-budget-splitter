// Holiday & Event Budget Splitter Core Logic
(function () {
  // DOM Elements
  const targetBudgetInput = document.getElementById('targetBudgetInput');
  const actualSpentVal = document.getElementById('actualSpentVal');
  const remainingFundsVal = document.getElementById('remainingFundsVal');
  const budgetPercentVal = document.getElementById('budgetPercentVal');
  const progressBarFill = document.getElementById('progressBarFill');
  const itemsTableBody = document.getElementById('itemsTableBody');
  const addItemBtn = document.getElementById('addItemBtn');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const resetBtn = document.getElementById('resetBtn');

  // Splitter Elements
  const groupMembersInput = document.getElementById('groupMembersInput');
  const sharedCostInput = document.getElementById('sharedCostInput');
  const perPersonShareVal = document.getElementById('perPersonShareVal');
  const splitSummaryText = document.getElementById('splitSummaryText');

  // Initial State
  const defaultItems = [
    { name: "Mom (Cashmere Scarf)", category: "Gifts", target: 80, actual: 75, status: "Purchased" },
    { name: "Dad (Smart Thermostat)", category: "Gifts", target: 140, actual: 129, status: "Purchased" },
    { name: "Dinner Catering & Drinks", category: "Food & Drinks", target: 350, actual: 380, status: "Planned" },
    { name: "Holiday Table Decor", category: "Decor", target: 90, actual: 85, status: "Wrapped" },
    { name: "Secret Santa Gift", category: "Gifts", target: 50, actual: 48, status: "Planned" }
  ];

  let items = JSON.parse(localStorage.getItem('event_budget_items') || 'null') || defaultItems;
  let targetBudget = parseFloat(localStorage.getItem('event_target_budget')) || 1500;
  targetBudgetInput.value = targetBudget;

  function formatCurrency(num) {
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function renderTable() {
    itemsTableBody.innerHTML = '';
    items.forEach((item, index) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><input type="text" class="table-input" value="${item.name}" data-idx="${index}" data-field="name"></td>
        <td>
          <select class="status-select" data-idx="${index}" data-field="category">
            <option value="Gifts" ${item.category === 'Gifts' ? 'selected' : ''}>Gifts</option>
            <option value="Food & Drinks" ${item.category === 'Food & Drinks' ? 'selected' : ''}>Food & Drinks</option>
            <option value="Travel" ${item.category === 'Travel' ? 'selected' : ''}>Travel</option>
            <option value="Decor" ${item.category === 'Decor' ? 'selected' : ''}>Decor</option>
            <option value="Other" ${item.category === 'Other' ? 'selected' : ''}>Other</option>
          </select>
        </td>
        <td><input type="number" class="table-input" value="${item.target}" min="0" step="1" data-idx="${index}" data-field="target"></td>
        <td><input type="number" class="table-input" value="${item.actual}" min="0" step="1" data-idx="${index}" data-field="actual"></td>
        <td>
          <select class="status-select" data-idx="${index}" data-field="status">
            <option value="Planned" ${item.status === 'Planned' ? 'selected' : ''}>Planned</option>
            <option value="Purchased" ${item.status === 'Purchased' ? 'selected' : ''}>Purchased</option>
            <option value="Wrapped" ${item.status === 'Wrapped' ? 'selected' : ''}>Wrapped</option>
            <option value="Delivered" ${item.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          </select>
        </td>
        <td><button class="delete-btn" data-idx="${index}">✕</button></td>
      `;
      itemsTableBody.appendChild(tr);
    });
  }

  function updateCalculations() {
    targetBudget = parseFloat(targetBudgetInput.value) || 0;
    let totalSpent = 0;
    items.forEach(it => {
      totalSpent += parseFloat(it.actual) || 0;
    });

    const remaining = targetBudget - totalSpent;
    const percent = targetBudget > 0 ? (totalSpent / targetBudget) * 100 : 0;

    actualSpentVal.textContent = formatCurrency(totalSpent);
    remainingFundsVal.textContent = formatCurrency(remaining);
    budgetPercentVal.textContent = percent.toFixed(1) + '%';

    // Visual gauge
    const clampedWidth = Math.min(percent, 100);
    progressBarFill.style.width = clampedWidth + '%';

    if (remaining < 0) {
      remainingFundsVal.className = 'metric-val primary';
      progressBarFill.style.background = '#ef4444';
    } else {
      remainingFundsVal.className = 'metric-val success';
      progressBarFill.style.background = 'linear-gradient(90deg, #10b981 0%, #f59e0b 70%, #f43f5e 100%)';
    }

    // Auto-save to LocalStorage
    localStorage.setItem('event_budget_items', JSON.stringify(items));
    localStorage.setItem('event_target_budget', targetBudget.toString());
  }

  function updateSplitter() {
    const rawMembers = groupMembersInput.value || '';
    const members = rawMembers.split(',').map(m => m.trim()).filter(m => m.length > 0);
    const totalCost = parseFloat(sharedCostInput.value) || 0;

    const count = Math.max(members.length, 1);
    const perPerson = totalCost / count;

    perPersonShareVal.textContent = formatCurrency(perPerson);
    splitSummaryText.textContent = `${count} member(s) (${members.join(', ') || 'Group'}) splitting ${formatCurrency(totalCost)} equally.`;
  }

  // Event Listeners: Table delegation
  itemsTableBody.addEventListener('input', (e) => {
    const idx = e.target.dataset.idx;
    const field = e.target.dataset.field;
    if (idx !== undefined && field) {
      if (field === 'target' || field === 'actual') {
        items[idx][field] = parseFloat(e.target.value) || 0;
      } else {
        items[idx][field] = e.target.value;
      }
      updateCalculations();
    }
  });

  itemsTableBody.addEventListener('change', (e) => {
    const idx = e.target.dataset.idx;
    const field = e.target.dataset.field;
    if (idx !== undefined && field) {
      items[idx][field] = e.target.value;
      updateCalculations();
    }
  });

  itemsTableBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('delete-btn')) {
      const idx = parseInt(e.target.dataset.idx, 10);
      items.splice(idx, 1);
      renderTable();
      updateCalculations();
    }
  });

  addItemBtn.addEventListener('click', () => {
    items.push({
      name: "New Gift / Expense",
      category: "Gifts",
      target: 50,
      actual: 0,
      status: "Planned"
    });
    renderTable();
    updateCalculations();
  });

  targetBudgetInput.addEventListener('input', updateCalculations);
  groupMembersInput.addEventListener('input', updateSplitter);
  sharedCostInput.addEventListener('input', updateSplitter);

  // CSV Export
  exportCsvBtn.addEventListener('click', () => {
    let csv = "Item/Recipient,Category,Target Budget ($),Actual Spent ($),Status\n";
    items.forEach(it => {
      const cleanName = `"${it.name.replace(/"/g, '""')}"`;
      csv += `${cleanName},${it.category},${it.target},${it.actual},${it.status}\n`;
    });
    csv += `\nSUMMARY,,,\n`;
    csv += `Target Budget,,${targetBudget}\n`;
    const totalSpent = items.reduce((acc, it) => acc + (parseFloat(it.actual) || 0), 0);
    csv += `Total Spent,,${totalSpent}\n`;
    csv += `Remaining,,${targetBudget - totalSpent}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Event_Budget_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  });

  resetBtn.addEventListener('click', () => {
    if (confirm("Reset budget and restore default example items?")) {
      items = [...defaultItems];
      targetBudget = 1500;
      targetBudgetInput.value = 1500;
      renderTable();
      updateCalculations();
    }
  });

  // Initial Boot
  renderTable();
  updateCalculations();
  updateSplitter();
})();
