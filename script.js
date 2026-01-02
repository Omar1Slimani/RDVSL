
        let clients = {};

        // Charger les données du localStorage
        function loadClients() {
            const saved = localStorage.getItem('clientsData');
            if (saved) {
                clients = JSON.parse(saved);
                renderClients();
            }
        }

        // Sauvegarder dans localStorage
        function saveClients() {
            localStorage.setItem('clientsData', JSON.stringify(clients));
            showSaveIndicator();
        }

        function showSaveIndicator() {
            const indicator = document.getElementById('saveIndicator');
            indicator.classList.add('show');
            setTimeout(() => {
                indicator.classList.remove('show');
            }, 2000);
        }

        // Ajouter un nouveau client
        function addClient() {
            const nd = document.getElementById('newClientND').value.trim();
            if (!nd) {
                alert('Veuillez entrer un ND');
                return;
            }
            if (clients[nd]) {
                alert('Ce client existe déjà');
                return;
            }

            clients[nd] = {
                nd: nd,
                ivr: 'NON',
                injTime: '',
                callTime: '',
                rdvTime: '',
                pdya: 'NON',
                contact: '',
                anal: '',
                profile: 'NON',
                acs: 'NON',
                motif: 'NON',
                commentaire: ''
            };

            saveClients();
            renderClients();
            document.getElementById('newClientND').value = '';
        }

        // Supprimer un client
        function deleteClient(nd) {
            if (confirm(`Voulez-vous vraiment supprimer le client ${nd} ?`)) {
                delete clients[nd];
                saveClients();
                renderClients();
            }
        }

        // Toggle client details
        function toggleClient(nd) {
            const details = document.getElementById(`details-${nd}`);
            details.classList.toggle('open');
        }

        // Calculer l'heure d'appel (temps original + 1 heure)
        function calculateCallTime(nd) {
            const injTime = document.getElementById(`injTime-${nd}`).value;
            if (injTime) {
                const [hours, minutes] = injTime.split(':');
                const date = new Date();
                date.setHours(parseInt(hours), parseInt(minutes));
                date.setHours(date.getHours() + 1);
                
                const callTime = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                document.getElementById(`callTime-${nd}`).textContent = callTime;
                clients[nd].callTime = callTime;
            } else {
                document.getElementById(`callTime-${nd}`).textContent = '--:--';
                clients[nd].callTime = '';
            }
            saveClients();
        }

        // Copier le numéro de téléphone
        function copyPhone(nd) {
            const phone = document.getElementById(`contact-${nd}`).value;
            if (phone) {
                navigator.clipboard.writeText(phone).then(() => {
                    alert('Numéro copié !');
                });
            }
        }

        // Mettre à jour les données du client
        function updateClient(nd, field, value) {
            clients[nd][field] = value;
            saveClients();
        }

        // Recherche
        document.getElementById('searchInput').addEventListener('input', function(e) {
            const search = e.target.value.toLowerCase();
            renderClients(search);
        });

        // Render clients list
        function renderClients(searchTerm = '') {
            const container = document.getElementById('clientsList');
            container.innerHTML = '';

            const filteredClients = Object.values(clients).filter(client => 
                client.nd.toLowerCase().includes(searchTerm)
            );

            filteredClients.forEach(client => {
                const card = document.createElement('div');
                card.className = 'client-card';
                card.innerHTML = `
                    <div class="client-header" onclick="toggleClient('${client.nd}')">
                        <div class="client-nd">ND: ${client.nd}</div>
                        <div class="client-actions">
                            <button class="btn-icon" onclick="event.stopPropagation(); deleteClient('${client.nd}')" title="Supprimer">🗑️</button>
                        </div>
                    </div>
                    <div class="client-details" id="details-${client.nd}">
                        <div class="client-form">
                            <div class="form-group">
                                <label>IVR</label>
                                <select id="ivr-${client.nd}" onchange="updateClient('${client.nd}', 'ivr', this.value); toggleInjRdv('${client.nd}')">
                                    <option value="NON" ${client.ivr === 'NON' ? 'selected' : ''}>NON</option>
                                    <option value="OK" ${client.ivr === 'OK' ? 'selected' : ''}>OK</option>
                                    <option value="inj" ${client.ivr === 'inj' ? 'selected' : ''}>Injoignable (inj)</option>
                                    <option value="RDV" ${client.ivr === 'RDV' ? 'selected' : ''}>RDV</option>
                                </select>
                            </div>

                            <div class="form-group ${client.ivr === 'inj' ? '' : 'hidden'}" id="injGroup-${client.nd}">
                                <label>Temps Injoignable</label>
                                <div class="inline-group">
                                    <div class="form-group">
                                        <input type="text" id="injTime-${client.nd}" value="${client.injTime}" 
                                               placeholder="Ex: 14:30"
                                               onchange="updateClient('${client.nd}', 'injTime', this.value); calculateCallTime('${client.nd}')">
                                    </div>
                                    <div class="form-group">
                                        <label>Heure d'appel (+ 1h)</label>
                                        <div class="time-display" id="callTime-${client.nd}">${client.callTime || '--:--'}</div>
                                    </div>
                                </div>
                            </div>

                            <div class="form-group ${client.ivr === 'RDV' ? '' : 'hidden'}" id="rdvGroup-${client.nd}">
                                <label>Heure RDV</label>
                                <input type="text" id="rdvTime-${client.nd}" value="${client.rdvTime}" 
                                       placeholder="Ex: 16:00"
                                       onchange="updateClient('${client.nd}', 'rdvTime', this.value)">
                            </div>

                            <div class="form-group">
                                <label>PDYA</label>
                                <select id="pdya-${client.nd}" onchange="updateClient('${client.nd}', 'pdya', this.value)">
                                    <option value="NON" ${client.pdya === 'NON' ? 'selected' : ''}>NON</option>
                                    <option value="Open" ${client.pdya === 'Open' ? 'selected' : ''}>Open</option>
                                    <option value="Close" ${client.pdya === 'Close' ? 'selected' : ''}>Close</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Contact</label>
                                <div class="inline-group">
                                    <div class="form-group">
                                        <input type="tel" id="contact-${client.nd}" value="${client.contact}" 
                                               placeholder="Numéro de téléphone"
                                               onchange="updateClient('${client.nd}', 'contact', this.value)">
                                    </div>
                                    <button class="copy-btn" onclick="copyPhone('${client.nd}')">📋 Copier</button>
                                </div>
                            </div>

                            <div class="three-col-group">
                                <div class="form-group">
                                    <label>Analyseur</label>
                                    <input type="text" id="anal-${client.nd}" value="${client.anal}" 
                                           placeholder="Ex: 17/18"
                                           onchange="updateClient('${client.nd}', 'anal', this.value)">
                                </div>
                                <div class="form-group">
                                    <label>Profile</label>
                                    <select id="profile-${client.nd}" onchange="updateClient('${client.nd}', 'profile', this.value)">
                                        <option value="NON" ${client.profile === 'NON' ? 'selected' : ''}>NON</option>
                                        <option value="12M" ${client.profile === '12M' ? 'selected' : ''}>12M</option>
                                        <option value="20M" ${client.profile === '20M' ? 'selected' : ''}>20M</option>
                                        <option value="100M" ${client.profile === '100M' ? 'selected' : ''}>100M</option>
                                        <option value="200M" ${client.profile === '200M' ? 'selected' : ''}>200M</option>
                                        <option value="500M" ${client.profile === '500M' ? 'selected' : ''}>500M</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label>ACS</label>
                                    <select id="acs-${client.nd}" onchange="updateClient('${client.nd}', 'acs', this.value)">
                                        <option value="NON" ${client.acs === 'NON' ? 'selected' : ''}>NON</option>
                                        <option value="UP" ${client.acs === 'UP' ? 'selected' : ''}>UP</option>
                                        <option value="Down" ${client.acs === 'Down' ? 'selected' : ''}>Down</option>
                                    </select>
                                </div>
                            </div>

                            <div class="form-group">
                                <label>Motif</label>
                                <select id="motif-${client.nd}" onchange="updateClient('${client.nd}', 'motif', this.value)">
                                    <option value="NON" ${client.motif === 'NON' ? 'selected' : ''}>NON</option>
                                    <option value="Borne oxydée" ${client.motif === 'Borne oxydée' ? 'selected' : ''}>Borne oxydée</option>
                                    <option value="RJ11" ${client.motif === 'RJ11' ? 'selected' : ''}>RJ11</option>
                                    <option value="Bien connecté" ${client.motif === 'Bien connecté' ? 'selected' : ''}>Bien connecté</option>
                                    <option value="Lenteur" ${client.motif === 'Lenteur' ? 'selected' : ''}>Lenteur</option>
                                    <option value="Microcoupure" ${client.motif === 'Microcoupure' ? 'selected' : ''}>Microcoupure</option>
                                    <option value="Interocoupure" ${client.motif === 'Interocoupure' ? 'selected' : ''}>Interocoupure</option>
                                    <option value="@ rouge" ${client.motif === '@ rouge' ? 'selected' : ''}>@ rouge</option>
                                    <option value="Mac corrigé" ${client.motif === 'Mac corrigé' ? 'selected' : ''}>Mac corrigé</option>
                                </select>
                            </div>

                            <div class="form-group">
                                <label>Commentaire</label>
                                <textarea id="commentaire-${client.nd}" 
                                          onchange="updateClient('${client.nd}', 'commentaire', this.value)"
                                          placeholder="Votre commentaire personnel...">${client.commentaire}</textarea>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }

        // Toggle injection/RDV groups based on IVR selection
        function toggleInjRdv(nd) {
            const ivr = document.getElementById(`ivr-${nd}`).value;
            const injGroup = document.getElementById(`injGroup-${nd}`);
            const rdvGroup = document.getElementById(`rdvGroup-${nd}`);

            if (ivr === 'inj') {
                injGroup.classList.remove('hidden');
                rdvGroup.classList.add('hidden');
            } else if (ivr === 'RDV') {
                rdvGroup.classList.remove('hidden');
                injGroup.classList.add('hidden');
            } else {
                injGroup.classList.add('hidden');
                rdvGroup.classList.add('hidden');
            }
        }

        // Initialiser l'application
        loadClients();
