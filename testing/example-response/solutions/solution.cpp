#include <bits/stdc++.h>
using namespace std;

typedef long long ll;
long long INF=1e18;

vector<vector<ll>> allPairsDijkstra(int n, vector<vector<pair<int, ll>>>& adj, string& status) {
    vector<vector<ll>> dist(n, vector<ll>(n, INF));

    for (int src = 0; src < n; ++src) {
        priority_queue<pair<ll, int>, vector<pair<ll, int>>, greater<>> pq;
        if (status[src] == 'x') continue;
        
        dist[src][src] = 0;
        pq.push({0, src});

        while (!pq.empty()) {
            auto d = pq.top().first;
            auto u = pq.top().second;
            pq.pop();
            if (d > dist[src][u]) continue;

            for (auto val : adj[u]) {
                auto v = val.first;
                auto w = val.second;
                
                if (status[v] == 'x') continue;

                if (dist[src][v] > dist[src][u] + w) {
                    dist[src][v] = dist[src][u] + w;
                    pq.push({dist[src][v], v});
                }
            }
        }
    }

    return dist;
}

void solve() {
    int n, m, q;
    cin >> n >> m >> q;

    vector<vector<pair<int, ll>>> adj(n);
    for(int i=0; i<m; i++) {
        int u, v, w;
        cin >> u >> v >> w;
        adj[u-1].push_back({v-1, w});
        adj[v-1].push_back({u-1, w});
    }

    string status;
    cin >> status;

    vector<vector<ll>> dist = allPairsDijkstra(n, adj, status);

    //debug
    // for(int i=0;i<dist.size();i++){
    //     for(int j=0;j<dist[i].size();j++){
    //         cout << i << " " << j << " " << (dist[i][j] >= INF ? -1 : dist[i][j]) << endl;
    //     }
    // }

    while(q--) {
        int type;
        cin >> type;
        if (type == 0) {
            int x, y;
            cin >> x >> y;
            x--;
            y--;
            ll ans = dist[x][y];
            if (ans >= INF)
                cout << -1 << endl;
            else
                cout << ans << endl;
        } else {  // type == 1
            int x;
            cin >> x;
            x--;
            status[x] = (status[x] == '.') ? 'x' : '.';
            dist = allPairsDijkstra(n, adj, status);
        }
    }
}

int main(){
    int t;
    cin >> t;
    while(t--){
        solve();
    }
    return 0;
}