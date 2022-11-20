.LC0:
.string "%d + %d = %d\n"
main:
push    rbp
mov     rbp, rsp
sub     rsp, 32
mov     DWORD PTR [rbp-20], edi
mov     DWORD PTR [rbp-8], 0
mov     DWORD PTR [rbp-12], 0
mov     DWORD PTR [rbp-16], 0
mov     DWORD PTR [rbp-4], 0
jmp     .L2
.L3:
mov     eax, DWORD PTR [rbp-8]
lea     edx, [rax+1]
mov     eax, DWORD PTR [rbp-4]
add     edx, eax
mov     eax, DWORD PTR [rbp-12]
add     eax, edx
lea     edx, [rax+1]
mov     eax, DWORD PTR [rbp-4]
add     eax, edx
mov     DWORD PTR [rbp-16], eax
mov     eax, DWORD PTR [rbp-12]
lea     edx, [rax+1]
mov     eax, DWORD PTR [rbp-4]
add     edx, eax
mov     eax, DWORD PTR [rbp-8]
lea     ecx, [rax+1]
mov     eax, DWORD PTR [rbp-4]
lea     esi, [rcx+rax]
mov     eax, DWORD PTR [rbp-16]
mov     ecx, eax
mov     edi, OFFSET FLAT:.LC0
mov     eax, 0
call    printf
add     DWORD PTR [rbp-4], 1
.L2:
cmp     DWORD PTR [rbp-4], 9
jle     .L3
mov     eax, 0
leave
ret
