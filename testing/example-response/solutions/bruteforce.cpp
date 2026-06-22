#include <bits/stdc++.h>
using namespace std;

typedef long long ll;
long long INF=1e18;
#define f(a, b, i) for (int i = a; i < b; i++)

vector<vector<ll> > dist;
vector<vector<int> > edges;
void reBuild(int n, int m, string &status) {
    dist.assign(n, vector<ll>(n, INF));
    f(0, n, i) {
        if (status[i] == '.') dist[i][i] = 0;
    }
    f(0, m, i) {
        int u = edges[i][0], v = edges[i][1], w = edges[i][2];
        if (status[u] == '.' && status[v] == '.') {
            dist[u][v] = min(dist[u][v], (ll)w);
            dist[v][u] = min(dist[v][u], (ll)w);
        }
    }
}
void reCurse(string &status, int n) {
    f(0, n, k) {
        if (status[k] == 'x') continue;
        f(0, n, i) {
            if (status[i] == 'x') continue;
            if (dist[i][k] == INF) continue;
            f(0, n, j) {
                if (status[j] == 'x') continue;
                if (dist[k][j] == INF) continue;
                ll cand = dist[i][k] + dist[k][j];
                if (cand < dist[i][j]) dist[i][j] = cand;
            }
        }
    }
}
void resolve2() {
    int n, m, q;
    cin >> n >> m >> q;
    edges.resize(m, vector<int>(3));
    f(0, m, i) {
        int u, v, w;
        cin >> u >> v >> w;
        u--;
        v--;
        edges[i][0] = u;
        edges[i][1] = v;
        edges[i][2] = w;
    }
    string status;
    cin >> status;
    reBuild(n, m, status);
    reCurse(status, n);
    f(0, q, qi) {
        int type;
        cin >> type;
        if (type == 0) {
            int x, y;
            cin >> x >> y;
            x--;
            y--;
            if (status[x] == 'x' || status[y] == 'x') {
                cout << -1 << endl;
                continue;
            }
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
            reBuild(n, m, status);
            reCurse(status, n);
        }
    }
}

int main(){
    int t;
    cin >> t;
    while(t--){
        resolve2();
    }
    return 0;
}