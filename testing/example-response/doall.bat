rem   *** validation ***
call scripts\run-validator-tests.bat
call scripts\run-checker-tests.bat

rem    *** tests ***
md tests
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --min_n=2 --max_n=10 --min_m=10 --max_m=30 --max_w=1000 --max_q=20 --min_q=5" "tests\03" 3
call scripts\gen-input-via-stdout.bat "files\gen-random.exe 1234" "tests\04" 4
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --min_n=1000" "tests\05" 5
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --min_n=100 --min_w=500000000" "tests\06" 6
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --min_n=100 --min_w=900000000" "tests\07" 7
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --max_n=100" "tests\08" 8
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --max_n=100 --min_m=1000" "tests\09" 9
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --min_n=45 --max_n=45 --min_m=900 --max_m=1000" "tests\10" 10
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --min_m=900 --max_m=1000" "tests\11" 11
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --min_n=10 --min_m=1000" "tests\12" 12
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --min_n=1000 --min_m=1000" "tests\13" 13
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --min_n=1000 --min_m=1000 --min_q=10000 --max_q=10000" "tests\14" 14
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --max_n=10 --min_m=1000" "tests\15" 15
call scripts\gen-input-via-stdout.bat "files\gen-random.exe --min_n=10 --max_n=10 --min_m=1000" "tests\16" 16
call scripts\gen-input-via-stdout.bat "files\gen-random-unblocked.exe --min_n=45 --max_n=45 --min_m=1000 --min_q=10000" "tests\17" 17
call scripts\gen-input-via-stdout.bat "files\gen-random-unblocked.exe --min_n=1000 --max_n=1000 --min_m=100 --max_m=100 --min_q=10000" "tests\18" 18
call scripts\gen-input-via-stdout.bat "files\gen-random-unblocked.exe --min_n=100 --max_n=100 --min_m=1000 --max_m=1000 --min_q=10000" "tests\19" 19
call scripts\gen-input-via-stdout.bat "files\gen-random-unblocked.exe --t=1 --min_n=1000 --max_n=1000 --min_m=1000 --min_q=10000" "tests\20" 20
call scripts\gen-input-via-stdout.bat "files\gen-v1-overflow.exe --t=1 --n=63" "tests\21" 21
call scripts\gen-input-via-stdout.bat "files\gen-v1-overflow.exe --t=2 --n=44" "tests\22" 22
call scripts\gen-input-via-stdout.bat "files\gen-v1-overflow.exe --t=1 --n=1000" "tests\23" 23
call scripts\gen-input-via-stdout.bat "files\gen-v1-overflow.exe --t=1 --n=1000 --min_w=1000000000" "tests\24" 24
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=1 --n=1000 --m=1000" "tests\25" 25
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=2 --n=1000 --m=500" "tests\26" 26
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=2 --n=500 --m=1000" "tests\27" 27
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=4 --n=500 --m=500" "tests\28" 28
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=4 --n=1000 --m=250" "tests\29" 29
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=4 --n=250 --m=1000" "tests\30" 30
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=8 --n=250 --m=500" "tests\31" 31
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=8 --n=500 --m=250" "tests\32" 32
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=8 --n=1000 --m=125" "tests\33" 33
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=8 --n=125 --m=1000" "tests\34" 34
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=10 --n=1000 --m=100" "tests\35" 35
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=10 --n=100 --m=1000" "tests\36" 36
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=5 --n=200 --m=1000" "tests\37" 37
call scripts\gen-input-via-stdout.bat "files\gen-v1.exe --t=5 --n=1000 --m=200" "tests\38" 38
call scripts\gen-input-via-stdout.bat "files\gen-random-unblocked.exe --t=1 --min_n=1000 --max_n=1000 --min_m=1000 --min_q=10000 --max_q=10000" "tests\39" 39
call scripts\gen-answer.bat tests\01 tests\01.a "tests" ""
call scripts\gen-answer.bat tests\02 tests\02.a "tests" ""
call scripts\gen-answer.bat tests\03 tests\03.a "tests" ""
call scripts\gen-answer.bat tests\04 tests\04.a "tests" ""
call scripts\gen-answer.bat tests\05 tests\05.a "tests" ""
call scripts\gen-answer.bat tests\06 tests\06.a "tests" ""
call scripts\gen-answer.bat tests\07 tests\07.a "tests" ""
call scripts\gen-answer.bat tests\08 tests\08.a "tests" ""
call scripts\gen-answer.bat tests\09 tests\09.a "tests" ""
call scripts\gen-answer.bat tests\10 tests\10.a "tests" ""
call scripts\gen-answer.bat tests\11 tests\11.a "tests" ""
call scripts\gen-answer.bat tests\12 tests\12.a "tests" ""
call scripts\gen-answer.bat tests\13 tests\13.a "tests" ""
call scripts\gen-answer.bat tests\14 tests\14.a "tests" ""
call scripts\gen-answer.bat tests\15 tests\15.a "tests" ""
call scripts\gen-answer.bat tests\16 tests\16.a "tests" ""
call scripts\gen-answer.bat tests\17 tests\17.a "tests" ""
call scripts\gen-answer.bat tests\18 tests\18.a "tests" ""
call scripts\gen-answer.bat tests\19 tests\19.a "tests" ""
call scripts\gen-answer.bat tests\20 tests\20.a "tests" ""
call scripts\gen-answer.bat tests\21 tests\21.a "tests" ""
call scripts\gen-answer.bat tests\22 tests\22.a "tests" ""
call scripts\gen-answer.bat tests\23 tests\23.a "tests" ""
call scripts\gen-answer.bat tests\24 tests\24.a "tests" ""
call scripts\gen-answer.bat tests\25 tests\25.a "tests" ""
call scripts\gen-answer.bat tests\26 tests\26.a "tests" ""
call scripts\gen-answer.bat tests\27 tests\27.a "tests" ""
call scripts\gen-answer.bat tests\28 tests\28.a "tests" ""
call scripts\gen-answer.bat tests\29 tests\29.a "tests" ""
call scripts\gen-answer.bat tests\30 tests\30.a "tests" ""
call scripts\gen-answer.bat tests\31 tests\31.a "tests" ""
call scripts\gen-answer.bat tests\32 tests\32.a "tests" ""
call scripts\gen-answer.bat tests\33 tests\33.a "tests" ""
call scripts\gen-answer.bat tests\34 tests\34.a "tests" ""
call scripts\gen-answer.bat tests\35 tests\35.a "tests" ""
call scripts\gen-answer.bat tests\36 tests\36.a "tests" ""
call scripts\gen-answer.bat tests\37 tests\37.a "tests" ""
call scripts\gen-answer.bat tests\38 tests\38.a "tests" ""
call scripts\gen-answer.bat tests\39 tests\39.a "tests" ""

