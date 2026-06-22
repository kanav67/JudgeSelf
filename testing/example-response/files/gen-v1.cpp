#include "testlib.h"
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    registerGen(argc, argv, 1);

    int t  = opt<int>("t", 10);
    int n  = opt<int>("n", 1000);
    int m  = opt<int>("m", 1000);
    int q  = opt<int>("q", 10000);
    long long min_w   = opt<long long>("min_w", 1e8);
    long long max_w   = opt<long long>("max_w", 1e9);

    int m2 = min(n*(n-1)/2, 1000000/n);
    m = min(m, m2);
    
    println(t);

    for (int test = 0; test < t; ++test) {
        println(n, m, q);

        set<pair<int, int>> edgeSet;
        for (int i = 0; i < m; ++i) {
            int u, v;
            do {
                u = rnd.next(0, n - 1);
                v = rnd.next(0, n - 1);
            } while (u == v || edgeSet.count({u, v}) || edgeSet.count({v, u}));
            edgeSet.insert({u, v});
            
            long long w = rnd.next(min_w, max_w);
            println(u + 1, v + 1, w); //1 index
        }

        string status(n, '.');
        println(status);
        
        int countAi = 0;
        int maxCountAi = 10;
        for (int i = 0; i < q; ++i) {
            if(countAi<maxCountAi){
                countAi++;
                println(1, 1);
                continue;
            }
            int x = rnd.next(1, n);
            int y = rnd.next(1, n);
            println(0, x, y);
        }
    }
}
