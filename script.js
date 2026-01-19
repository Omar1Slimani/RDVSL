
        const API_URL = 'https://script.google.com/macros/s/AKfycbzDz0356OLdWKaitfsi3TEptsS7Pqr_YtBCfqxYifntGSrkYT19pbWvogLIPRaHx9JvFQ/exec';
        
        let currentUser = null;
        let currentRole = null;
        let currentAdminUsers = [];
        let currentData = [];
        let selectedNDForTransfer = null;

        // Connexion
        async function login() {
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value.trim();
            const errorMsg = document.getElementById('errorMessage');
            
            if (!username || !password) {
                showError('Veuillez saisir le nom d\'utilisateur et le mot de passe');
                return;
            }
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify({
                        action: 'login',
                        username: username,
                        password: password
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    currentUser = result.data.username;
                    currentRole = result.data.role;
                    
                    document.getElementById('loginPage').style.display = 'none';
                    document.getElementById('mainPage').style.display = 'block';
                    
                    // Mettre à jour le badge de rôle
                    const roleBadge = document.getElementById('userRoleBadge');
                    roleBadge.textContent = currentRole === 'admin' ? 'Administrateur' : 'Utilisateur';
                    
                    if (currentRole === 'admin') {
                        document.getElementById('pageTitle').textContent = 'Tableau de Bord Administrateur - ' + currentUser;
                        await loadAdminUsers();
                    } else {
                        document.getElementById('pageTitle').textContent = `Utilisateur - ${currentUser}`;
                    }
                    
                    refreshData();
                } else {
                    showError(result.message);
                }
            } catch (error) {
                showError('Erreur de connexion au serveur: ' + error.message);
                console.error('Login error:', error);
            }
        }

        // Charger les utilisateurs sous l'administrateur
        async function loadAdminUsers() {
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify({
                        action: 'getUsersByAdmin',
                        adminUsername: currentUser
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    currentAdminUsers = result.data;
                    console.log('Utilisateurs sous administration:', currentAdminUsers);
                }
            } catch (error) {
                console.error('Error loading admin users:', error);
            }
        }

        // Actualiser les données
        async function refreshData() {
            const contentArea = document.getElementById('contentArea');
            contentArea.innerHTML = '<div class="loading">Chargement des données...</div>';
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify({
                        action: 'getData',
                        username: currentUser,
                        role: currentRole
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    currentData = result.data;
                    displayData(result.data);
                } else {
                    contentArea.innerHTML = `
                        <div class="error-box">
                            <strong>Erreur de chargement des données:</strong><br>
                            ${result.message}
                        </div>
                    `;
                }
            } catch (error) {
                contentArea.innerHTML = `
                    <div class="error-box">
                        <strong>Erreur de connexion au serveur:</strong><br>
                        ${error.message}
                    </div>
                `;
                console.error('Refresh error:', error);
            }
        }

        // Afficher les données
        function displayData(data) {
            const contentArea = document.getElementById('contentArea');
            
            if (data.length === 0) {
                contentArea.innerHTML = '<div class="no-data">Aucune donnée disponible pour le moment</div>';
                return;
            }
            
            let html = '';
            
            // Pour les administrateurs: afficher les statistiques des utilisateurs
            if (currentRole === 'admin' && currentAdminUsers.length > 0) {
                html += renderUsersStatistics();
            }
            
            // Afficher les ND
            data.forEach((nd, index) => {
                const isInProgress = nd.inProgress ? 'in-progress' : '';
                const ndTitle = nd.ND ? `ND: ${nd.ND}` : 'ND sans numéro';
                
                html += `
                    <div class="nd-item ${isInProgress}">
                        <div class="nd-header" onclick="toggleND(${index})">
                            <div>
                                <div class="nd-title">${ndTitle}</div>
                                <div class="nd-secteur">${nd.Secteur || 'Non spécifié'}</div>
                            </div>
                            <div>▼</div>
                        </div>
                        <div class="nd-details" id="nd-${index}">
                            ${renderNDDetails(nd, index)}
                        </div>
                    </div>
                `;
            });
            
            contentArea.innerHTML = html;
        }

        // Afficher les statistiques des utilisateurs (pour admin)
        function renderUsersStatistics() {
            let html = `
                <div class="users-stats">
                    <div class="stats-title">
                        <span>Statistiques des Utilisateurs</span>
                    </div>
                    <div class="stats-grid">
                        <div class="stat-card">
                            <div class="stat-value">${currentAdminUsers.length}</div>
                            <div class="stat-label">Utilisateurs Actifs</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${currentData.length}</div>
                            <div class="stat-label">Dossiers Totaux</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">${currentData.filter(nd => nd.inProgress).length}</div>
                            <div class="stat-label">En Attente</div>
                        </div>
                    </div>
                    
                    <div class="section-title" style="margin-top: 20px;">Utilisateurs du Secteur</div>
                    <div class="users-list">
            `;
            
            currentAdminUsers.forEach(user => {
                html += `
                    <div class="user-card">
                        <div class="user-name">${user.username}</div>
                        <div class="user-secteur">${user.secteur}</div>
                        <span class="user-status">Actif</span>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
            
            return html;
        }

        // Afficher les détails ND
        function renderNDDetails(nd, index) {
            let html = '';
            
            if (currentRole === 'user') {
                // Pour l'utilisateur: afficher les informations de sa page
                html += `
                    <div class="section-title">Informations du Dossier</div>
                    <div class="info-grid">
                        <div class="info-card">
                            <div class="info-title">ND</div>
                            <div class="info-value">${nd.ND || 'Non spécifié'}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-title">Constitution</div>
                            <div class="info-value">${nd.Constitution || 'Non spécifié'}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-title">S. Produit</div>
                            <div class="info-value">${nd['S. Produit'] || 'Non spécifié'}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-title">Client</div>
                            <div class="info-value">${nd.Client || 'Non spécifié'}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-title">Secteur</div>
                            <div class="info-value">${nd.Secteur || 'Non spécifié'}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-title">Contact Client</div>
                            <div class="info-value">${nd['Contact client'] || 'Non spécifié'}</div>
                        </div>
                        <div class="info-card">
                            <div class="info-title">ADRESSE</div>
                            <div class="info-value">${nd.ADRESSE || 'Non spécifié'}</div>
                        </div>
                    </div>
                    
                    <div class="section-title">Saisie des Informations de Clôture</div>
                    
                    <div class="detail-row">
                        <label class="detail-label">IVR:</label>
                        <select id="ivr-${index}" onchange="handleIVRChange(${index})">
                            <option value="NON">NON</option>
                            <option value="OK">OK</option>
                            <option value="INJ">INJ</option>
                            <option value="RDV">RDV</option>
                        </select>
                    </div>
                    
                    <div id="datetime-container-${index}" style="display: none;" class="detail-row">
                        <label class="detail-label">Date et Heure:</label>
                        <input type="datetime-local" id="datetime-${index}" class="datetime-input">
                    </div>
                    
                    <div class="detail-row">
                        <label class="detail-label">Motif:</label>
                        <select id="motif-${index}">
                            <option value="NON">NON</option>
                            <option value="@rouge">@rouge</option>
                            <option value="Microcoupure">Microcoupure</option>
                            <option value="Borne oxydée">Borne oxydée</option>
                            <option value="Port isolé">Port isolé</option>
                        </select>
                    </div>
                    
                    <div class="detail-row">
                        <label class="detail-label">Commentaire (optionnel):</label>
                        <textarea id="comment-${index}" rows="3" placeholder="Entrez un commentaire..."></textarea>
                    </div>
                    
                    <button class="btn-close" onclick="closeND(${index})">Clôturer ND et Envoyer pour Confirmation</button>
                `;
            } 
            else if (currentRole === 'admin') {
                // Pour l'administrateur
                if (nd.inProgress) {
                    html += `
                        <div class="section-title">Informations de Clôture (En Attente de Confirmation)</div>
                        <div class="info-grid">
                            <div class="info-card">
                                <div class="info-title">IVR</div>
                                <div class="info-value">${nd.IVR || nd.Client || 'Non spécifié'}</div>
                            </div>
                            <div class="info-card">
                                <div class="info-title">Motif</div>
                                <div class="info-value">${nd.Motif || 'Non spécifié'}</div>
                            </div>
                            <div class="info-card">
                                <div class="info-title">Commentaire</div>
                                <div class="info-value">${nd.Commentaire || 'Aucun'}</div>
                            </div>
                            <div class="info-card">
                                <div class="info-title">Clôturé par</div>
                                <div class="info-value">${nd.ClosedBy || 'Non spécifié'}</div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px; text-align: center;">
                            <button class="btn-confirm" onclick="confirmND(${index})">Confirmer Définitivement</button>
                        </div>
                    `;
                } else {
                    // ND à transférer
                    html += `
                        <div class="section-title">Informations du Dossier</div>
                        <div class="info-grid">
                            <div class="info-card">
                                <div class="info-title">ND</div>
                                <div class="info-value">${nd.ND || 'Non spécifié'}</div>
                            </div>
                            <div class="info-card">
                                <div class="info-title">Nom Client</div>
                                <div class="info-value">${nd['Client'] || 'Non spécifié'}</div>
                            </div>
                            <div class="info-card">
                                <div class="info-title">Secteur</div>
                                <div class="info-value">${nd.Secteur || 'Non spécifié'}</div>
                            </div>
                            <div class="info-card">
                                <div class="info-title">Type</div>
                                <div class="info-value">${nd['S. Produit'] || 'Non spécifié'}</div>
                            </div>
                        </div>
                        
                        <div style="margin-top: 20px; text-align: center;">
                            <button class="btn-transfer" onclick="openTransferModal(${index})">Transférer à un Utilisateur</button>
                        </div>
                    `;
                }
            }
            
            return html;
        }

        // Ouvrir/fermer ND
        function toggleND(index) {
            const details = document.getElementById(`nd-${index}`);
            details.classList.toggle('open');
        }

        // Gérer le changement IVR
        function handleIVRChange(index) {
            const select = document.getElementById(`ivr-${index}`);
            const datetimeContainer = document.getElementById(`datetime-container-${index}`);
            const datetimeInput = document.getElementById(`datetime-${index}`);
            
            if (select.value === 'INJ' || select.value === 'RDV') {
                datetimeContainer.style.display = 'block';
                
                if (select.value === 'INJ') {
                    // Ajouter une heure à l'heure actuelle
                    const now = new Date();
                    now.setHours(now.getHours() + 1);
                    datetimeInput.value = now.toISOString().slice(0, 16);
                } else if (select.value === 'RDV') {
                    // Champ vide pour que l'utilisateur entre l'heure
                    datetimeInput.value = '';
                }
            } else {
                datetimeContainer.style.display = 'none';
            }
        }

        // Clôturer ND (par l'utilisateur)
        async function closeND(index) {
            const nd = currentData[index];
            const ivr = document.getElementById(`ivr-${index}`).value;
            const motif = document.getElementById(`motif-${index}`).value;
            const comment = document.getElementById(`comment-${index}`).value;
            
            let datetime = null;
            if (ivr === 'INJ' || ivr === 'RDV') {
                datetime = document.getElementById(`datetime-${index}`).value;
                if (!datetime) {
                    alert('Veuillez spécifier la date et l\'heure');
                    return;
                }
            }
            
            if (ivr === 'NON' || motif === 'NON') {
                alert('Veuillez remplir tous les champs obligatoires');
                return;
            }
            
            if (!confirm('Êtes-vous sûr de vouloir clôturer ce dossier et l\'envoyer pour confirmation?')) {
                return;
            }
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify({
                        action: 'closeND',
                        nd: nd,
                        client: ivr,
                        motif: motif,
                        commentaire: comment,
                        datetime: datetime,
                        username: currentUser,
                        userRole: currentRole
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Dossier clôturé avec succès et envoyé pour confirmation de l\'administrateur');
                    refreshData();
                } else {
                    alert('Erreur: ' + result.message);
                }
            } catch (error) {
                alert('Erreur de connexion: ' + error.message);
                console.error('Close ND error:', error);
            }
        }

        // Confirmer ND (par l'administrateur)
        async function confirmND(index) {
            const nd = currentData[index];
            
            if (!confirm(`Êtes-vous sûr de vouloir confirmer définitivement le dossier ${nd.ND}?`)) {
                return;
            }
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify({
                        action: 'confirmND',
                        nd: nd.ND
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert('Dossier confirmé avec succès');
                    refreshData();
                } else {
                    alert('Erreur: ' + result.message);
                }
            } catch (error) {
                alert('Erreur de connexion: ' + error.message);
                console.error('Confirm ND error:', error);
            }
        }

        // Ouvrir la modal de transfert
        function openTransferModal(index) {
            selectedNDForTransfer = currentData[index];
            
            const transferUserSelect = document.getElementById('transferUser');
            transferUserSelect.innerHTML = '<option value="">-- Sélectionner un utilisateur --</option>';
            
            currentAdminUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.username;
                option.textContent = `${user.username} (${user.secteur})`;
                option.setAttribute('data-secteur', user.secteur);
                transferUserSelect.appendChild(option);
            });
            
            transferUserSelect.onchange = function() {
                const selectedOption = this.options[this.selectedIndex];
                const secteur = selectedOption.getAttribute('data-secteur') || '';
                document.getElementById('targetSecteur').value = secteur;
            };
            
            document.getElementById('transferModal').style.display = 'block';
        }

        // Fermer la modal de transfert
        function closeTransferModal() {
            document.getElementById('transferModal').style.display = 'none';
            document.getElementById('transferUser').value = '';
            document.getElementById('targetSecteur').value = '';
            document.getElementById('transferReason').value = '';
            selectedNDForTransfer = null;
        }

        // Exécuter le transfert
        async function executeTransfer() {
            const targetUser = document.getElementById('transferUser').value;
            const targetSecteur = document.getElementById('targetSecteur').value;
            const reason = document.getElementById('transferReason').value.trim();
            
            if (!targetUser) {
                alert('Veuillez sélectionner un utilisateur');
                return;
            }
            
            if (!selectedNDForTransfer) {
                alert('Aucun dossier ND sélectionné pour le transfert');
                return;
            }
            
            if (!confirm(`Êtes-vous sûr de vouloir transférer le dossier ${selectedNDForTransfer.ND} à ${targetUser}?`)) {
                return;
            }
            
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'text/plain;charset=utf-8'
                    },
                    body: JSON.stringify({
                        action: 'transferND',
                        nd: selectedNDForTransfer.ND,
                        targetUser: targetUser,
                        transferReason: reason,
                        admin: currentUser
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    alert(`Dossier transféré avec succès à ${targetUser}`);
                    closeTransferModal();
                    refreshData();
                } else {
                    alert('Erreur: ' + result.message);
                }
            } catch (error) {
                alert('Erreur de connexion: ' + error.message);
                console.error('Transfer error:', error);
            }
        }

        // Afficher un message d'erreur
        function showError(message) {
            const errorMsg = document.getElementById('errorMessage');
            errorMsg.textContent = message;
            errorMsg.style.display = 'block';
            setTimeout(() => {
                errorMsg.style.display = 'none';
            }, 3000);
        }

        // Déconnexion
        function logout() {
            if (confirm('Voulez-vous vraiment vous déconnecter?')) {
                currentUser = null;
                currentRole = null;
                currentAdminUsers = [];
                currentData = [];
                selectedNDForTransfer = null;
                
                document.getElementById('mainPage').style.display = 'none';
                document.getElementById('loginPage').style.display = 'block';
                document.getElementById('username').value = '';
                document.getElementById('password').value = '';
                document.getElementById('userRoleBadge').textContent = '';
            }
        }

        // Permettre la connexion avec Enter
        document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('password').addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    login();
                }
            });
            
            // Fermer la modal en cliquant à l'extérieur
            window.onclick = function(event) {
                const modal = document.getElementById('transferModal');
                if (event.target === modal) {
                    closeTransferModal();
                }
            }
        });
